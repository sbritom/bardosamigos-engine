import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import { CoverApi } from "../covers/CoverApi.js";
import { HealthApi } from "../health/HealthApi.js";
import { LibraryApi } from "../library/LibraryApi.js";
import { MetadataApi } from "../metadata/MetadataApi.js";
import { PlayerApi } from "../player/PlayerApi.js";
import { XatApi } from "../xat/XatApi.js";
import { RadioAdminApi } from "../admin/RadioAdminApi.js";
import { AudienceApi } from "../audience/AudienceApi.js";
import { ReleaseApi } from "../release/ReleaseApi.js";

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  response.end(JSON.stringify(payload));
}

function sendImage(response, payload) {
  response.writeHead(200, {
    "Content-Type": payload.mimeType,
    "Cache-Control": "public, max-age=86400",
    "Access-Control-Allow-Origin": "*",
  });
  fs.createReadStream(payload.filePath).pipe(response);
}

const MXCAST_OFFICIAL_STATS_URL = "https://api.mxcast.com.br/stream/7186/stats";
const MXCAST_LEGACY_STATS_URL = "https://stm1.mxcast.com.br:7186/stats?sid=1";
const MXCAST_AUDIO_STREAM_URL = "https://stm1.mxcast.com.br:7186/stream";
const MXCAST_REQUEST_TIMEOUT_MS = 8000;

function normalizeMxCastJson(data = {}) {
  const online = String(data.stream_status || "").toLowerCase() === "on";

  return {
    online,
    songTitle: data.song_title || "Programação ao vivo",
    listeners: Number(data.listeners) || 0,
    peakListeners: Number(data.peak_listeners) || 0,
    bitrate: Number(data.bitrate) || 0,
    sampleRate: Number(data.samplerate) || 0,
    contentType: data.encoder || "",
    serverTitle: data.server_name || "Radio Bar Dos Amigos",
    streamUrl: MXCAST_AUDIO_STREAM_URL,
    cover: data.cover || "",
    updatedAt: new Date().toISOString(),
  };
}

async function fetchOfficialMxCastStatus() {
  const response = await fetch(MXCAST_OFFICIAL_STATS_URL, {
    headers: {
      "User-Agent": "Radio-Bar-dos-Amigos/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(MXCAST_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`MxCast oficial respondeu com HTTP ${response.status}`);
  }

  return normalizeMxCastJson(await response.json());
}

async function fetchLegacyMxCastStatus() {
  const response = await fetch(MXCAST_LEGACY_STATS_URL, {
    headers: {
      "User-Agent": "Radio-Bar-dos-Amigos/1.0",
      Accept: "application/xml,text/xml,*/*",
    },
    signal: AbortSignal.timeout(MXCAST_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`MxCast legado respondeu com HTTP ${response.status}`);
  }

  const xml = await response.text();

  function getXmlValue(tagName) {
    const match = xml.match(
      new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i")
    );

    return match?.[1]?.trim() || "";
  }

  function decodeXml(value) {
    return String(value || "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  const rawSongTitle = decodeXml(getXmlValue("SONGTITLE"));
  const streamStatus = getXmlValue("STREAMSTATUS") === "1";
  const listeners = Number(getXmlValue("CURRENTLISTENERS")) || 0;
  const peakListeners = Number(getXmlValue("PEAKLISTENERS")) || 0;
  const bitrate = Number(getXmlValue("BITRATE")) || 0;
  const sampleRate = Number(getXmlValue("SAMPLERATE")) || 0;
  const contentType = getXmlValue("CONTENT") || "";
  const serverTitle = decodeXml(getXmlValue("SERVERTITLE")) || "Radio Bar Dos Amigos";

  return {
    online: streamStatus,
    songTitle: rawSongTitle || "Programação ao vivo",
    listeners,
    peakListeners,
    bitrate,
    sampleRate,
    contentType,
    serverTitle,
    streamUrl: MXCAST_AUDIO_STREAM_URL,
    cover: "",
    updatedAt: new Date().toISOString(),
  };
}

async function getMxCastStatus() {
  try {
    return await fetchOfficialMxCastStatus();
  } catch (officialError) {
    try {
      const fallbackStatus = await fetchLegacyMxCastStatus();

      return {
        ...fallbackStatus,
        fallback: true,
        fallbackReason: officialError.message,
      };
    } catch (fallbackError) {
      throw new Error(
        `MxCast indisponivel. Oficial: ${officialError.message}. Fallback: ${fallbackError.message}`,
        { cause: fallbackError }
      );
    }
  }
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

  async handle(request, response) {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, null);
      return;
    }

    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const imagePayload = this.resolveImage(url.pathname);
      if (imagePayload) {
        sendImage(response, imagePayload);
        return;
      }

      const data = request.method === "POST"
        ? this.resolvePost(url.pathname, await this.readBody(request))
        : request.method === "DELETE"
          ? this.resolveDelete(url.pathname)
        : await this.resolve(url.pathname, url);

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
    const metadataApi = new MetadataApi(this.engine.libraryManager?.metadataEngine, this.engine.libraryManager);
    const healthApi = new HealthApi(this.engine.healthEngine);
    const playerApi = new PlayerApi(this.engine.player);
    const xatApi = new XatApi(this.engine.xat);
    const adminApi = new RadioAdminApi(this.engine);
    const audienceApi = new AudienceApi(this.engine.audience);
    const releaseApi = new ReleaseApi(this.engine.release);
    const coverApi = new CoverApi({
      coverEngine: this.engine.libraryManager?.metadataEngine?.coverEngine,
      libraryManager: this.engine.libraryManager,
    });
    const status = () => this.engine.getStatus();
    const library = () => libraryApi.list();
    const libraryStats = () => libraryApi.stats();
    const librarySearch = (url) => libraryApi.search(url.searchParams.get("q"));
    const libraryEvents = (url) => libraryApi.events(url.searchParams.get("limit"));
    const history = () => this.engine.history.list();
    const nowPlaying = () => this.engine.nowPlaying.get();
    const health = () => healthApi.health();
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
    const metadata = (pathname) => metadataApi.get(pathname.replace("/engine/metadata/", ""));
    const deployStatus = () => this.engine.deploy?.status();
    const deployServices = () => this.engine.deploy?.services();
    const deployVersion = () => this.engine.deploy?.version();

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
      "/engine/metadata/cache": () => metadataApi.cache(),
      "/engine/metadata/stats": () => metadataApi.stats(),
      "/engine/covers/stats": () => coverApi.stats(),
      "/engine/player/state": () => playerApi.state(),
      "/engine/player/nowplaying": () => playerApi.nowPlaying(),
      "/engine/player/history": () => playerApi.history(),
      "/engine/player/next": () => playerApi.next(),
      "/engine/player/status": () => playerApi.status(),
      "/engine/xat/config": () => xatApi.config(),
      "/engine/xat/status": () => xatApi.status(),
      "/engine/xat/widget": () => xatApi.widget(),
      "/engine/xat/stream": () => xatApi.stream(),
      "/engine/history": history,
      "/engine/queue": queue,
      "/engine/nowplaying": nowPlaying,
      "/engine/now-playing": nowPlaying,
      "/engine/health": health,
      "/engine/health/report": () => healthApi.report(),
      "/engine/health/modules": () => healthApi.modules(),
      "/engine/health/events": () => healthApi.events(),
      "/engine/health/version": () => healthApi.version(),
      "/engine/config": config,
      "/engine/stream": stream,
      "/engine/radio/mxcast/status": () => getMxCastStatus(),
      "/engine/audio": audio,
      "/engine/icecast": icecast,
      "/engine/icecast/debug": icecastDebug,
      "/engine/network/debug": networkDebug,
      "/engine/deploy/status": deployStatus,
      "/engine/deploy/services": deployServices,
      "/engine/deploy/version": deployVersion,
      "/engine/admin/dashboard": () => adminApi.dashboard(),
      "/engine/admin/storage": () => adminApi.storage(),
      "/engine/admin/system": () => adminApi.system(),
      "/engine/admin/config": () => adminApi.config(),
      "/engine/admin/logs": () => adminApi.logs(),
      "/engine/audience": () => audienceApi.summary(),
      "/engine/audience/stats": () => audienceApi.stats(),
      "/engine/audience/history": () => audienceApi.history(),
      "/engine/audience/most-played": () => audienceApi.mostPlayed(),
      "/engine/audience/favorites": () => audienceApi.favorites(),
      "/engine/requests": () => audienceApi.requests(),
      "/engine/release": () => releaseApi.release(),
      "/engine/release/status": () => releaseApi.status(),
      "/engine/release/report": () => releaseApi.report(),
      "/engine/release/version": () => releaseApi.version(),
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

    if (pathname.startsWith("/engine/metadata/") && !routes[pathname]) {
      return metadata(pathname);
    }

    return routes[pathname]?.(url);
  }

  resolveImage(pathname) {
    const coverEngine = this.engine.libraryManager?.metadataEngine?.coverEngine;
    if (!coverEngine || !pathname.startsWith("/engine/covers/")) return null;
    if (pathname === "/engine/covers/stats") return null;

    const coverApi = new CoverApi({
      coverEngine,
      libraryManager: this.engine.libraryManager,
    });

    if (pathname === "/engine/covers/default") return coverApi.resolve("default");

    const match = pathname.match(/^\/engine\/covers\/([^/]+)(?:\/(512|256|128|64))?$/);
    if (!match) return null;

    return coverApi.resolve(decodeURIComponent(match[1]), match[2] || null);
  }

  async readBody(request) {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    if (!chunks.length) return {};
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }

  resolvePost(pathname, body = {}) {
    const audienceApi = new AudienceApi(this.engine.audience);
    const routes = {
      "/engine/restart": () => {
        this.engine.restart().catch((error) => {
          this.logger.error("api", "Falha ao reiniciar engine.", { error: error.message });
        });
        return { restarting: true };
      },
      "/engine/requests": () => audienceApi.createRequest(body),
    };

    return routes[pathname]?.();
  }

  resolveDelete(pathname) {
    const audienceApi = new AudienceApi(this.engine.audience);
    const requestMatch = pathname.match(/^\/engine\/requests\/([^/]+)$/);
    if (requestMatch) {
      return audienceApi.cancelRequest(decodeURIComponent(requestMatch[1]));
    }

    return undefined;
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
      "player:ready",
      "player:updated",
      "player:trackChanged",
      "player:volumeChanged",
      "xat:ready",
      "xat:connected",
      "xat:disconnected",
      "xat:widgetUpdated",
      "admin:opened",
      "admin:updated",
      "admin:settingsChanged",
      "request:created",
      "request:accepted",
      "request:rejected",
      "request:played",
      "favorites:updated",
      "statistics:updated",
      "audience:updated",
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
