import http from "node:http";
import crypto from "node:crypto";
import { LibraryApi } from "../library/LibraryApi.js";

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  response.end(JSON.stringify(payload));
}

export class ApiEngine {
  constructor(engine, logger) {
    this.engine = engine;
    this.logger = logger;
    this.server = null;
    this.wsClients = new Set();
  }

  async init() {
    this.server = http.createServer((request, response) => this.handle(request, response));
    this.server.on("upgrade", (request, socket) => this.handleUpgrade(request, socket));
    await new Promise((resolve) => {
      this.server.listen(this.engine.config.apiPort, resolve);
    });
    this.bindEvents();
    this.logger.info("api", "API iniciada.", { port: this.engine.config.apiPort });
  }

  handle(request, response) {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, null);
      return;
    }

    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const data = request.method === "POST"
        ? this.resolvePost(url.pathname)
        : this.resolve(url.pathname, url);

      if (data === undefined) {
        sendJson(response, 404, { ok: false, error: "Endpoint not found." });
        return;
      }

      sendJson(response, 200, { ok: true, data });
    } catch (error) {
      this.logger.error("api", "Erro na API.", { error: error.message });
      sendJson(response, 500, { ok: false, error: "Internal engine error." });
    }
  }

  resolve(pathname, url = null) {
    const libraryApi = new LibraryApi(this.engine.libraryManager);
    const status = () => this.engine.getStatus();
    const library = () => libraryApi.list();
    const libraryStats = () => libraryApi.stats();
    const librarySearch = (url) => libraryApi.search(url.searchParams.get("q"));
    const libraryEvents = (url) => libraryApi.events(url.searchParams.get("limit"));
    const history = () => this.engine.history.list();
    const nowPlaying = () => this.engine.nowPlaying.get();
    const health = () => this.engine.healthCheck();
    const config = () => this.engine.config;
    const queue = () => this.engine.playlist.queueList();
    const stream = () => this.engine.stream.status();
    const audio = () => ({
      queue: this.engine.audioQueue.list(),
      next: this.engine.audioQueue.peek(),
      encoder: this.engine.config.audio,
      ffmpeg: this.engine.ffmpeg.status(),
    });
    const icecast = () => this.engine.icecast.status();
    const icecastDebug = () => this.engine.icecast.debugStatus(this.engine.ffmpeg.status());
    const networkDebug = () => this.engine.networkDiagnostics.lastResult || { ok: false, message: "Network diagnostics not executed yet." };

    const routes = {
      "/engine/status": status,
      "/engine/library": library,
      "/engine/library/stats": libraryStats,
      "/engine/library/search": librarySearch,
      "/engine/library/events": libraryEvents,
      "/engine/library/genres": () => libraryApi.genres(),
      "/engine/library/artists": () => libraryApi.artists(),
      "/engine/library/albums": () => libraryApi.albums(),
      "/engine/library/folders": () => libraryApi.folders(),
      "/engine/history": history,
      "/engine/queue": queue,
      "/engine/nowplaying": nowPlaying,
      "/engine/now-playing": nowPlaying,
      "/engine/health": health,
      "/engine/config": config,
      "/engine/stream": stream,
      "/engine/audio": audio,
      "/engine/icecast": icecast,
      "/engine/icecast/debug": icecastDebug,
      "/engine/network/debug": networkDebug,
      "/api/radio/status": status,
      "/api/radio/library": library,
      "/api/radio/history": history,
      "/api/radio/queue": queue,
      "/api/radio/nowplaying": nowPlaying,
      "/api/radio/config": config,
      "/api/radio/playlists": () => this.engine.playlist.tracks,
      "/api/radio/categories": () => [...new Set(this.engine.library.list().map((track) => track.genre).filter(Boolean))],
      "/api/radio/listeners": () => [],
      "/api/radio/stats": () => ({ tracks: this.engine.library.list().length, history: this.engine.history.list().length }),
      "/api/radio/logs": () => [],
      "/api/radio/schedule": () => this.engine.scheduler.list(),
    };

    return routes[pathname]?.(url);
  }

  resolvePost(pathname) {
    const routes = {
      "/engine/restart": () => {
        this.engine.restart().catch((error) => {
          this.logger.error("api", "Falha ao reiniciar engine.", { error: error.message });
        });
        return { restarting: true };
      },
    };

    return routes[pathname]?.();
  }

  bindEvents() {
    [
      "trackChanged",
      "streamStarted",
      "streamStopped",
      "listenerUpdate",
      "metadataChanged",
      "library:changed",
      "playlist:reloaded",
      "queue:updated",
      "autodj:synchronized",
    ].forEach((eventName) => {
      this.engine.events.on(eventName, (payload) => {
        this.broadcast({ event: eventName, payload, emittedAt: new Date().toISOString() });
      });
    });
  }

  handleUpgrade(request, socket) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname !== "/engine/ws") {
      socket.destroy();
      return;
    }

    const key = request.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }

    const accept = crypto
      .createHash("sha1")
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest("base64");

    socket.write([
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "",
      "",
    ].join("\r\n"));

    this.wsClients.add(socket);
    socket.on("close", () => this.wsClients.delete(socket));
    socket.on("error", () => this.wsClients.delete(socket));
    this.sendFrame(socket, { event: "connected", payload: this.engine.getStatus() });
  }

  broadcast(message) {
    this.wsClients.forEach((socket) => this.sendFrame(socket, message));
  }

  sendFrame(socket, message) {
    const payload = Buffer.from(JSON.stringify(message));
    const header = payload.length < 126
      ? Buffer.from([0x81, payload.length])
      : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 0xff]);
    socket.write(Buffer.concat([header, payload]));
  }

  async stop() {
    if (!this.server) return;
    this.wsClients.forEach((socket) => socket.destroy());
    this.wsClients.clear();
    await new Promise((resolve) => this.server.close(resolve));
    this.server = null;
  }
}
