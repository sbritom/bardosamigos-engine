import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const expectedEvents = [
  "track:added",
  "track:removed",
  "track:updated",
  "library:changed",
  "playlist:reloaded",
  "queue:updated",
  "autodj:synchronized",
  "player:ready",
  "player:updated",
  "player:trackChanged",
  "player:volumeChanged",
];

function ok(name, details = {}) {
  return moduleStatus(name, "OK", "healthy", details);
}

function warn(name, details = {}) {
  return moduleStatus(name, "WARN", "warning", details);
}

function fail(name, details = {}) {
  return moduleStatus(name, "FAIL", "failed", details);
}

function moduleStatus(name, status, health, details = {}) {
  const now = new Date().toISOString();
  return {
    name,
    status,
    startedAt: details.startedAt || null,
    lastCheck: now,
    lastError: details.lastError || null,
    uptime: details.uptime || null,
    version: details.version || "1.0.0",
    health,
    details,
  };
}

export class HealthChecks {
  constructor(engine) {
    this.engine = engine;
  }

  runAll() {
    const startedAt = performance.now();
    const modules = {
      icecast: this.checkIcecast(),
      ffmpeg: this.checkFFmpeg(),
      stream: this.checkStream(),
      library: this.checkLibrary(),
      watcher: this.checkWatcher(),
      playlist: this.checkPlaylist(),
      queue: this.checkQueue(),
      autodj: this.checkAutoDJ(),
      scheduler: this.checkScheduler(),
      metadata: this.checkMetadata(),
      cover: this.checkCover(),
      player: this.checkPlayer(),
      nowPlaying: this.checkNowPlaying(),
      api: this.checkApi(),
      storage: this.checkStorage(),
      cache: this.checkCache(),
      events: this.checkEvents(),
      players: this.checkPlayers(),
    };

    const performanceData = this.performance(startedAt);
    const failures = Object.values(modules).filter((item) => item.status === "FAIL");
    const warnings = Object.values(modules).filter((item) => item.status === "WARN");

    return {
      status: failures.length ? "OFFLINE" : "ONLINE",
      health: failures.length ? "failed" : warnings.length ? "warning" : "healthy",
      checkedAt: new Date().toISOString(),
      modules,
      events: this.eventStatus(),
      performance: performanceData,
    };
  }

  checkIcecast() {
    const status = this.engine.icecast?.status?.();
    if (!status) return fail("Icecast", { lastError: "Icecast client unavailable." });
    if (status.dryRun) return ok("Icecast", { dryRun: true });
    if (status.connected || status.mountActive || status.lastDebug?.httpStatus === 200) return ok("Icecast", status);
    return warn("Icecast", { ...status, lastError: status.lastError || "Icecast not connected." });
  }

  checkFFmpeg() {
    const status = this.engine.ffmpeg?.status?.();
    if (!status) return fail("FFmpeg", { lastError: "FFmpeg engine unavailable." });
    if (status.executablePath) return ok("FFmpeg", status);
    return warn("FFmpeg", { ...status, lastError: status.lastError || "FFmpeg executable not detected." });
  }

  checkStream() {
    const status = this.engine.stream?.status?.();
    if (!status) return fail("Stream", { lastError: "Stream engine unavailable." });
    return status.lastError ? warn("Stream", status) : ok("Stream", status);
  }

  checkLibrary() {
    const summary = this.engine.libraryManager?.getSummary?.();
    if (!summary?.ready) return fail("Library", { lastError: "Library Manager not ready." });
    return summary.tracks > 0 ? ok("Library", summary) : warn("Library", { ...summary, lastError: "Library is empty." });
  }

  checkWatcher() {
    const watcher = this.engine.libraryManager?.getWatcherStatus?.();
    if (!watcher) return fail("Watcher", { lastError: "Library watcher unavailable." });
    return watcher.online ? ok("Watcher", watcher) : warn("Watcher", { ...watcher, lastError: "Watcher offline." });
  }

  checkPlaylist() {
    const tracks = this.engine.playlist?.tracks || [];
    return tracks.length ? ok("Playlist", { tracks: tracks.length }) : warn("Playlist", { tracks: 0 });
  }

  checkQueue() {
    return ok("Queue", {
      playlistQueue: this.engine.playlist?.queueList?.().length || 0,
      audioQueue: this.engine.audioQueue?.list?.().length || 0,
      next: Boolean(this.engine.audioQueue?.peek?.() || this.engine.playlist?.peek?.()),
    });
  }

  checkAutoDJ() {
    return this.engine.autodj?.active ? ok("AutoDJ", { active: true }) : fail("AutoDJ", { lastError: "AutoDJ inactive." });
  }

  checkScheduler() {
    return this.engine.scheduler?.active ? ok("Scheduler", { active: true }) : warn("Scheduler", { active: false });
  }

  checkMetadata() {
    const track = this.engine.libraryManager?.getTracks?.()[0];
    if (!track) return warn("Metadata", { lastError: "No track available." });
    const missing = ["title", "artist", "album", "genre", "bitrate", "codec", "hash"].filter((field) => !(field in track));
    return missing.length ? warn("Metadata", { missing }) : ok("Metadata", {
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      bitrate: track.bitrate,
      codec: track.codec,
      hash: Boolean(track.hash),
    });
  }

  checkCover() {
    const tracks = this.engine.libraryManager?.getTracks?.() || [];
    const coverEngine = this.engine.libraryManager?.metadataEngine?.coverEngine;
    if (!coverEngine) return fail("Cover Engine", { lastError: "Cover Engine unavailable." });
    const stats = coverEngine.stats(tracks);
    return ok("Cover Engine", {
      ...stats,
      hasDefault: fs.existsSync(coverEngine.defaultCoverPath),
      thumbnails: this.countFiles(coverEngine.thumbFolder),
    });
  }

  checkPlayer() {
    const state = this.engine.player?.getState?.();
    if (!state) return fail("Player", { lastError: "Player Engine unavailable." });
    return ok("Player", { status: state.status, volume: state.volume, updatedAt: state.updatedAt });
  }

  checkNowPlaying() {
    return ok("Now Playing", this.engine.nowPlaying?.get?.() || { currentTrack: null });
  }

  checkApi() {
    return this.engine.api?.server ? ok("API", { port: this.engine.config?.apiPort }) : fail("API", { lastError: "API server unavailable." });
  }

  checkStorage() {
    const folders = [
      "server/storage/media",
      "server/storage/media/covers",
      "server/storage/media/thumbs",
      "server/storage/media/cache",
      "server/storage/media/waveforms",
    ];
    const missing = folders.filter((folder) => !fs.existsSync(path.resolve(folder)));
    return missing.length ? warn("Storage", { missing }) : ok("Storage", { folders });
  }

  checkCache() {
    const files = [
      "server/storage/library-cache.json",
      "server/storage/media/cache/metadata-cache.json",
      "server/storage/media/cache/cover-cache.json",
    ];
    const missing = files.filter((file) => !fs.existsSync(path.resolve(file)));
    return missing.length ? warn("Cache", { missing }) : ok("Cache", { files });
  }

  checkEvents() {
    const history = this.engine.events?.history?.() || [];
    const seen = new Set(history.map((item) => item.eventName));
    const available = expectedEvents.map((eventName) => ({
      eventName,
      seen: seen.has(eventName),
      registered: this.engine.events?.listeners?.has?.(eventName) || false,
    }));
    return ok("Events", { expected: available, historySize: history.length });
  }

  checkPlayers() {
    const root = path.resolve("public/player");
    const variants = ["mini", "compact", "portal", "full"];
    const players = variants.map((variant) => {
      const folder = path.join(root, variant);
      const files = ["index.html", "style.css", "player.js"].map((file) => path.join(folder, file));
      const consumesApi = fs.existsSync(path.join(folder, "player.js")) &&
        fs.readFileSync(path.join(folder, "player.js"), "utf8").includes("/engine/player/");
      return {
        variant,
        ready: files.every((file) => fs.existsSync(file)) && consumesApi,
        consumesApi,
      };
    });
    const failed = players.filter((player) => !player.ready);
    return failed.length ? warn("Players", { players }) : ok("Players", { players });
  }

  eventStatus() {
    const history = this.engine.events?.history?.() || [];
    const seen = new Set(history.map((item) => item.eventName));
    return expectedEvents.map((eventName) => ({
      eventName,
      seen: seen.has(eventName),
      registered: this.engine.events?.listeners?.has?.(eventName) || false,
    }));
  }

  performance(startedAt) {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    return {
      healthCheckMs: Math.round(performance.now() - startedAt),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
      },
      cpu: {
        user: cpu.user,
        system: cpu.system,
      },
      apiResponseMs: 0,
      libraryReadMs: 0,
      playerUpdateMs: 0,
      autoDjSyncMs: 0,
      platform: os.platform(),
    };
  }

  countFiles(folder) {
    if (!folder || !fs.existsSync(folder)) return 0;
    return fs.readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isFile()).length;
  }
}
