import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export class ReleaseReport {
  constructor({ engine, versionManager, validator }) {
    this.engine = engine;
    this.versionManager = versionManager;
    this.validator = validator;
    this.reportPath = path.resolve("server/storage/release/release-report.json");
  }

  generate() {
    fs.mkdirSync(path.dirname(this.reportPath), { recursive: true });
    const status = this.engine.getStatus();
    const validation = this.validator.validate();
    const memory = process.memoryUsage();
    const backup = this.createFinalBackup();
    const report = {
      version: this.versionManager.getVersion(),
      modules: this.modules(status),
      startup: {
        state: status.state,
        uptimeSeconds: process.uptime(),
      },
      performance: {
        memory,
        cpu: process.cpuUsage(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        librarySize: status.librarySize,
        playlistSize: status.playlistSize,
        queueSize: status.queueSize,
      },
      statistics: this.engine.audience?.statistics?.get?.() || {},
      integrity: validation.status,
      backup,
      errors: validation.errors,
      warnings: validation.warnings,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2), "utf8");
    return report;
  }

  modules(status) {
    return {
      icecast: Boolean(status.icecast),
      ffmpeg: Boolean(status.ffmpeg),
      stream: Boolean(status.stream),
      queue: status.queueSize >= 0,
      scheduler: Boolean(status.schedulerActive),
      autodj: Boolean(status.autoDJReady),
      library: Boolean(status.libraryManager?.ready),
      metadata: Boolean(this.engine.libraryManager?.metadataEngine),
      cover: Boolean(this.engine.libraryManager?.metadataEngine?.coverEngine),
      player: Boolean(this.engine.player),
      audience: Boolean(this.engine.audience),
      programming: Boolean(this.engine.programming),
      deploy: Boolean(this.engine.deploy),
      api: Boolean(this.engine.api?.server),
      cache: Boolean(this.engine.config?.cacheFolder),
    };
  }

  createFinalBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupRoot = path.resolve("server/backups", `release-final-${timestamp}`);
    const sources = [
      ["config", path.resolve("config")],
      ["library-cache", path.resolve("server/storage/library-cache.json")],
      ["cache", path.resolve("server/cache")],
      ["covers", path.resolve("server/storage/media/covers")],
      ["metadata", path.resolve("server/storage/media/cache")],
      ["programming", path.resolve("server/storage/programming")],
      ["audience", path.resolve("server/storage/audience")],
      ["playlist", path.resolve("server/playlists")],
      ["queue", path.resolve("server/storage/queue")],
      ["settings", path.resolve("config")],
    ];
    fs.mkdirSync(backupRoot, { recursive: true });

    const items = sources.map(([name, source]) => {
      const destination = path.join(backupRoot, name);
      const exists = fs.existsSync(source);
      if (exists) {
        fs.cpSync(source, destination, { recursive: true, force: true });
      }
      return { name, source, destination, copied: exists };
    });

    const manifest = {
      backupId: path.basename(backupRoot),
      createdAt: new Date().toISOString(),
      backupRoot,
      items,
    };
    fs.writeFileSync(path.join(backupRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    return manifest;
  }
}
