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
    this.lastRawStatus = null;
    this.lastError = null;
    this.lastDebug = null;
    this.mountHistory = new Set();
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
    const user = encodeURIComponent(this.config.username || "source");
    const password = encodeURIComponent(this.config.password || "");
    const mount = String(this.config.mount || "/radio").startsWith("/")
      ? this.config.mount
      : `/${this.config.mount}`;
    return `${protocol}://${user}:${password}@${this.config.host}:${this.config.port}${mount}`;
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
    const checkedAt = new Date().toISOString();
    const startedAt = Date.now();
    const statusUrl = this.getStatusUrl();
    if (this.config.dryRun) {
      this.connected = true;
      this.mountActive = true;
      this.lastDebug = {
        connected: true,
        httpStatus: 200,
        statusUrl,
        checkedAt,
        mountExpected: this.normalizeMount(this.config.mount),
        mountFound: this.normalizeMount(this.config.mount),
        mounts: [this.createMountInfo({ mount: this.config.mount })],
        mountCount: 1,
        listeners: 0,
        bitrate: null,
        contentType: this.audio.contentType,
        responseTimeMs: 0,
      };
      return this.status();
    }

    try {
      const response = await this.fetchStatusJson();
      const responseTimeMs = Date.now() - startedAt;
      const status = response.body;
      this.lastRawStatus = status;
      const sources = this.normalizeSources(status?.icestats?.source);
      const mounts = sources.map((source) => this.createMountInfo(source));
      const mount = this.normalizeMount(this.config.mount);
      const activeSource = mounts.find((source) => this.mountMatches(source.mount, mount));
      this.lastStatus = activeSource || null;
      this.mountActive = Boolean(activeSource);
      this.connected = this.mountActive;
      this.lastError = null;
      this.lastDebug = {
        connected: this.connected,
        httpStatus: response.httpStatus,
        statusUrl,
        checkedAt,
        mountExpected: mount,
        mountFound: activeSource?.mount || null,
        mounts,
        mountCount: mounts.length,
        listeners: Number(activeSource?.listeners || 0),
        bitrate: activeSource?.bitrate || null,
        contentType: activeSource?.contentType || null,
        responseTimeMs,
        rawResponse: status,
      };
      this.logDebugSnapshot(this.lastDebug);
      return this.status();
    } catch (error) {
      this.lastError = error.message;
      this.connected = false;
      this.mountActive = false;
      this.lastDebug = {
        connected: false,
        httpStatus: null,
        statusUrl,
        checkedAt,
        mountExpected: this.normalizeMount(this.config.mount),
        mountFound: null,
        mounts: [],
        mountCount: 0,
        listeners: 0,
        bitrate: null,
        contentType: null,
        responseTimeMs: Date.now() - startedAt,
        error: error.message,
      };
      this.logger.error("icecast", "Falha ao consultar status do Icecast.", { error: error.message });
      return this.status();
    }
  }

  waitForMount({ timeoutMs = 15000, intervalMs = 500, getFfmpegStatus = null } = {}) {
    const startedAt = Date.now();
    let attempt = 0;
    return new Promise((resolve) => {
      const tick = async () => {
        attempt += 1;
        const status = await this.refreshMountStatus();
        const elapsedMs = Date.now() - startedAt;
        const ffmpegStatus = getFfmpegStatus?.() || null;
        const pollingInfo = {
          attempt,
          elapsedMs,
          mountExpected: this.normalizeMount(this.config.mount),
          mountFound: this.lastDebug?.mountFound || null,
          mounts: this.lastDebug?.mounts || [],
          ffmpeg: ffmpegStatus ? {
            pid: ffmpegStatus.pid,
            running: ffmpegStatus.running,
            exitCode: ffmpegStatus.exitCode,
            signal: ffmpegStatus.signal,
            runtimeMs: ffmpegStatus.startedAt ? Date.now() - new Date(ffmpegStatus.startedAt).getTime() : null,
            stderr: ffmpegStatus.stderr || ffmpegStatus.lastStderr || "",
            stdout: ffmpegStatus.stdout || ffmpegStatus.lastStdout || "",
          } : null,
        };

        this.logger.info("icecast", "Polling de mount Icecast.", pollingInfo);
        if (this.logger.config?.logLevel === "debug") {
          console.info(`[stream:debug] Icecast mount polling attempt ${attempt}`);
          console.info(JSON.stringify(pollingInfo, null, 2));
        }

        if (status.mountActive) {
          this.logger.info("icecast", `Mount encontrado apos ${(elapsedMs / 1000).toFixed(1)} segundos.`, {
            attempts: attempt,
            elapsedMs,
            mount: this.lastDebug?.mountFound,
          });
          resolve(status);
          return;
        }

        if (ffmpegStatus && !ffmpegStatus.running && ffmpegStatus.exitedAt) {
          const message = "FFmpeg encerrou antes da confirmacao do mount.";
          this.logger.error("icecast", message, pollingInfo);
          if (this.logger.config?.logLevel === "debug") {
            console.error(`[stream:debug] ${message}`);
          }
          resolve(status);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
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
            resolve({
              httpStatus: response.statusCode,
              rawText: body,
              body: JSON.parse(body),
            });
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

  getStatusUrl() {
    return `${this.config.protocol || "http"}://${this.config.host}:${this.config.port}/status-json.xsl`;
  }

  normalizeMount(mount) {
    if (!mount) return "";
    return String(mount).startsWith("/") ? String(mount) : `/${mount}`;
  }

  mountMatches(foundMount, expectedMount) {
    const found = this.normalizeMount(foundMount);
    const expected = this.normalizeMount(expectedMount);
    return found === expected || found.endsWith(expected);
  }

  createMountInfo(source = {}) {
    const listenUrl = String(source.listenurl || source.listenUrl || "");
    const mountFromListenUrl = listenUrl ? new URL(listenUrl, "http://localhost").pathname : "";
    const mount = this.normalizeMount(source.mount || mountFromListenUrl || source.server_name || "");
    return {
      mount,
      listenUrl,
      listeners: Number(source.listeners || 0),
      bitrate: source.bitrate || source.audio_bitrate || null,
      contentType: source.server_type || source.content_type || source.contentType || null,
      title: source.title || source.yp_currently_playing || "",
    };
  }

  logDebugSnapshot(debug) {
    const mountNames = debug.mounts.map((mount) => mount.mount).filter(Boolean);
    this.logger.info("icecast", "Diagnostico de status Icecast.", {
      statusUrl: debug.statusUrl,
      checkedAt: debug.checkedAt,
      httpStatus: debug.httpStatus,
      responseTimeMs: debug.responseTimeMs,
      mountExpected: debug.mountExpected,
      mountFound: debug.mountFound,
      mountCount: debug.mountCount,
      mounts: debug.mounts,
    });

    if (this.logger.config?.logLevel === "debug") {
      console.info("[stream:debug] Icecast status check");
      console.info(JSON.stringify({
        statusUrl: debug.statusUrl,
        checkedAt: debug.checkedAt,
        httpStatus: debug.httpStatus,
        responseTimeMs: debug.responseTimeMs,
        mountExpected: debug.mountExpected,
        mountFound: debug.mountFound,
        mountCount: debug.mountCount,
        mounts: debug.mounts,
        rawResponse: debug.rawResponse,
      }, null, 2));
    }

    mountNames.forEach((mount) => {
      if (!this.mountHistory.has(mount)) {
        this.mountHistory.add(mount);
        this.logger.info("icecast", "Novo mount detectado.", { mount });
      }
    });
  }

  debugStatus(ffmpegStatus = null) {
    return {
      connected: this.connected,
      httpStatus: this.lastDebug?.httpStatus || null,
      mountExpected: this.lastDebug?.mountExpected || this.normalizeMount(this.config.mount),
      mountFound: this.lastDebug?.mountFound || null,
      listeners: this.lastDebug?.listeners || 0,
      bitrate: this.lastDebug?.bitrate || null,
      contentType: this.lastDebug?.contentType || null,
      ffmpegRunning: Boolean(ffmpegStatus?.running),
      ffmpegPid: ffmpegStatus?.pid || null,
      lastCheck: this.lastDebug?.checkedAt || null,
      responseTimeMs: this.lastDebug?.responseTimeMs || null,
      mounts: this.lastDebug?.mounts || [],
      rawResponse: this.lastDebug?.rawResponse || null,
      error: this.lastDebug?.error || this.lastError || null,
    };
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
      lastRawStatus: this.lastRawStatus,
      lastDebug: this.lastDebug,
      lastError: this.lastError,
      ...this.safeConfig(),
    };
  }
}
