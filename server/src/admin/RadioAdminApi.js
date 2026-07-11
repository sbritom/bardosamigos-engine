import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const LOG_FILES = [
  "deploy.log",
  "startup.log",
  "shutdown.log",
  "health.log",
  "stream.log",
  "library.log",
  "player.log",
];

function directorySize(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) return 0;
  const stats = fs.statSync(folderPath);
  if (stats.isFile()) return stats.size;

  return fs.readdirSync(folderPath).reduce((total, item) => {
    try {
      return total + directorySize(path.join(folderPath, item));
    } catch {
      return total;
    }
  }, 0);
}

function readLog(filePath, lines = 80) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, lines: [] };
  }

  const content = fs.readFileSync(filePath, "utf8");
  return {
    exists: true,
    lines: content.split(/\r?\n/).filter(Boolean).slice(-lines),
  };
}

export class RadioAdminApi {
  constructor(engine) {
    this.engine = engine;
  }

  dashboard() {
    this.emit("admin:opened");
    const status = this.engine.getStatus();
    const player = this.engine.player?.getState?.();
    const health = this.engine.healthEngine?.run?.();
    const system = this.system();

    this.emit("admin:updated", { section: "dashboard" });

    return {
      status,
      player,
      health,
      release: this.engine.release?.version?.(),
      system,
      library: this.librarySummary(),
      queue: this.queueSummary(),
      history: this.historySummary(50),
      icecast: this.engine.icecast?.status?.(),
      ffmpeg: this.engine.ffmpeg?.status?.(),
      scheduler: this.schedulerSummary(),
      autodj: this.autoDjSummary(),
      storage: this.storage(),
      config: this.config(),
      updatedAt: new Date().toISOString(),
    };
  }

  storage() {
    const root = this.engine.config;
    const paths = {
      library: root.libraryPath || root.musicFolder,
      cache: root.cacheFolder || path.resolve("server/cache"),
      covers: path.resolve("server/storage/media/covers"),
      thumbs: path.resolve("server/storage/media/thumbs"),
      logs: root.logFolder || path.resolve("server/logs"),
    };

    return {
      paths,
      sizes: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, directorySize(value)])),
      checkedAt: new Date().toISOString(),
    };
  }

  system() {
    const memory = process.memoryUsage();
    return {
      platform: os.platform(),
      cpu: {
        count: os.cpus().length,
        model: os.cpus()[0]?.model || "unknown",
      },
      ram: {
        total: os.totalmem(),
        free: os.freemem(),
        processRss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime(),
      },
      version: {
        node: process.version,
        engine: this.engine.healthEngine?.versionInfo?.(),
        release: this.engine.release?.version?.(),
      },
      checkedAt: new Date().toISOString(),
    };
  }

  config() {
    const config = this.engine.config || {};
    return {
      host: config.stream?.host,
      port: config.stream?.port,
      mount: config.stream?.mount,
      bitrate: config.audio?.bitrate,
      codec: config.audio?.codec,
      shuffle: config.shuffle,
      repeat: this.engine.playlist?.repeatEnabled || false,
      watcher: this.engine.libraryManager?.getWatcherStatus?.(),
      apiPort: config.apiPort,
      updatedAt: new Date().toISOString(),
    };
  }

  logs() {
    const logFolder = this.engine.config?.logFolder || path.resolve("server/logs");
    return {
      files: Object.fromEntries(LOG_FILES.map((fileName) => [
        fileName,
        readLog(path.join(logFolder, fileName)),
      ])),
      logFolder,
      updatedAt: new Date().toISOString(),
    };
  }

  librarySummary() {
    const stats = this.engine.libraryManager?.getStats?.() || {};
    const summary = this.engine.libraryManager?.getSummary?.() || {};
    return {
      ...summary,
      stats,
      totalTracks: summary.tracks || stats.tracks || 0,
      artists: stats.artistsCount || stats.artists || 0,
      albums: stats.albumsCount || stats.albums || 0,
      genres: stats.genresCount || stats.genres || 0,
      size: this.storage().sizes.library,
      updatedAt: summary.updatedAt || stats.updatedAt || null,
    };
  }

  queueSummary() {
    return {
      playlistQueue: this.engine.playlist?.queueList?.() || [],
      audioQueue: this.engine.audioQueue?.list?.() || [],
      next: this.engine.audioQueue?.peek?.() || this.engine.playlist?.peek?.() || null,
    };
  }

  historySummary(limit = 50) {
    return {
      tracks: (this.engine.history?.list?.() || []).slice(0, limit),
      total: this.engine.history?.list?.().length || 0,
    };
  }

  schedulerSummary() {
    return {
      active: Boolean(this.engine.scheduler?.active),
      nextRun: this.engine.scheduler?.nextRun || null,
      lastRun: this.engine.scheduler?.lastRun || null,
      items: this.engine.scheduler?.list?.() || [],
    };
  }

  autoDjSummary() {
    return {
      active: Boolean(this.engine.autodj?.active),
      mode: "auto",
      shuffle: Boolean(this.engine.config?.shuffle),
      repeat: Boolean(this.engine.playlist?.repeatEnabled),
      blacklist: this.engine.autodj?.blacklist || [],
    };
  }

  emit(eventName, payload = {}) {
    this.engine.events?.emit?.(eventName, {
      ...payload,
      emittedAt: new Date().toISOString(),
    });
  }
}
