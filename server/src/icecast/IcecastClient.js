import http from "node:http";
import https from "node:https";
import { Writable } from "node:stream";

class NullWritable extends Writable {
  _write(_chunk, _encoding, callback) {
    callback();
  }
}

export class IcecastClient {
  constructor(config, logger) {
    this.config = config.stream;
    this.audio = config.audio;
    this.logger = logger;
    this.request = null;
    this.connected = false;
    this.mountActive = false;
    this.lastStatus = null;
    this.lastError = null;
    this.heartbeatTimer = null;
  }

  connect() {
    if (this.connected && this.request) {
      return this.request;
    }

    if (this.config.dryRun) {
      this.connected = true;
      this.mountActive = true;
      this.logger.info("icecast", "Icecast dry-run conectado.", this.safeConfig());
      this.startHeartbeat();
      return new NullWritable();
    }

    const transport = this.config.protocol === "https" ? https : http;
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
    const options = {
      host: this.config.host,
      port: this.config.port,
      path: this.config.mount,
      method: "SOURCE",
      timeout: this.config.timeout,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": this.audio.contentType,
        "Ice-Name": "Radio Bar dos Amigos",
        "Ice-Public": "1",
      },
    };

    this.request = transport.request(options, (response) => {
      this.logger.info("icecast", "Resposta Icecast.", { statusCode: response.statusCode });
      this.connected = Boolean(response.statusCode && response.statusCode < 400);
      this.mountActive = this.connected;
      if (!this.connected) {
        this.logger.error("icecast", "Icecast recusou conexao SOURCE.", { statusCode: response.statusCode });
      }
    });
    this.request.on("error", (error) => {
      this.connected = false;
      this.mountActive = false;
      this.lastError = error.message;
      this.logger.error("icecast", "Erro na conexao Icecast.", { error: error.message });
    });
    this.startHeartbeat();
    return this.request;
  }

  prepareForExternalSource() {
    this.connected = false;
    this.mountActive = false;
    this.startHeartbeat();
    this.logger.info("icecast", "Icecast aguardando source externo via FFmpeg.", this.safeConfig());
    return this.status();
  }

  getSourceUrl() {
    const protocol = this.config.protocol === "https" ? "icecasts" : "icecast";
    const mount = String(this.config.mount || "/radio").startsWith("/")
      ? this.config.mount
      : `/${this.config.mount}`;
    return `${protocol}://${this.config.host}:${this.config.port}${mount}`;
  }

  disconnect() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.request?.end();
    this.request = null;
    this.connected = false;
    this.mountActive = false;
    this.logger.info("icecast", "Icecast desconectado.");
  }

  reconnect() {
    this.disconnect();
    return this.connect();
  }

  updateMetadata(track) {
    const song = [track?.artist, track?.title].filter(Boolean).join(" - ");

    if (!this.config.dryRun && song) {
      const transport = this.config.protocol === "https" ? https : http;
      const auth = Buffer.from(`${this.config.adminUser}:${this.config.adminPassword}`).toString("base64");
      const metadataPath = `/admin/metadata?mount=${encodeURIComponent(this.config.mount)}&mode=updinfo&song=${encodeURIComponent(song)}`;
      const request = transport.request({
        host: this.config.host,
        port: this.config.port,
        path: metadataPath,
        method: "GET",
        timeout: this.config.timeout,
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      request.on("error", (error) => {
        this.lastError = error.message;
        this.logger.error("icecast", "Erro ao atualizar metadata.", { error: error.message });
      });
      request.end();
    }

    this.logger.info("icecast", "Metadata atualizada.", {
      title: track?.title,
      artist: track?.artist,
      album: track?.album,
      dryRun: this.config.dryRun,
    });
  }

  startHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      await this.refreshMountStatus();
      this.logger.info("icecast", "Heartbeat Icecast.", {
        connected: this.connected,
        mountActive: this.mountActive,
      });
    }, this.config.heartbeat);
    this.heartbeatTimer.unref?.();
  }

  async refreshMountStatus() {
    if (this.config.dryRun) {
      this.connected = true;
      this.mountActive = true;
      return this.status();
    }

    try {
      const status = await this.fetchStatusJson();
      const sources = this.normalizeSources(status?.icestats?.source);
      const mount = String(this.config.mount || "/radio");
      const activeSource = sources.find((source) => {
        const listenUrl = String(source.listenurl || source.listenUrl || "");
        const sourceMount = String(source.mount || source.server_name || "");
        return listenUrl.endsWith(mount) || sourceMount === mount || sourceMount.endsWith(mount);
      });
      this.lastStatus = activeSource || null;
      this.mountActive = Boolean(activeSource);
      this.connected = this.mountActive;
      return this.status();
    } catch (error) {
      this.lastError = error.message;
      this.connected = false;
      this.mountActive = false;
      this.logger.error("icecast", "Falha ao consultar status do Icecast.", { error: error.message });
      return this.status();
    }
  }

  waitForMount({ timeoutMs = 10000, intervalMs = 500 } = {}) {
    const startedAt = Date.now();
    return new Promise((resolve) => {
      const tick = async () => {
        const status = await this.refreshMountStatus();
        if (status.mountActive || Date.now() - startedAt >= timeoutMs) {
          resolve(status);
          return;
        }
        const timer = setTimeout(tick, intervalMs);
        timer.unref?.();
      };
      tick();
    });
  }

  fetchStatusJson() {
    const transport = this.config.protocol === "https" ? https : http;
    return new Promise((resolve, reject) => {
      const request = transport.request({
        host: this.config.host,
        port: this.config.port,
        path: "/status-json.xsl",
        method: "GET",
        timeout: this.config.timeout,
      }, (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(`Icecast status returned ${response.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      });
      request.on("timeout", () => {
        request.destroy(new Error("Icecast status timeout"));
      });
      request.on("error", reject);
      request.end();
    });
  }

  normalizeSources(source) {
    if (!source) return [];
    return Array.isArray(source) ? source : [source];
  }

  safeConfig() {
    return {
      host: this.config.host,
      port: this.config.port,
      mount: this.config.mount,
      protocol: this.config.protocol,
      reconnect: this.config.reconnect,
      heartbeat: this.config.heartbeat,
      dryRun: this.config.dryRun,
    };
  }

  status() {
    return {
      connected: this.connected,
      mountActive: this.mountActive,
      lastStatus: this.lastStatus,
      lastError: this.lastError,
      ...this.safeConfig(),
    };
  }
}
