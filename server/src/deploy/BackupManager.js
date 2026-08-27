import fs from "node:fs";
import path from "node:path";

export class BackupManager {
  constructor(config) {
    this.config = config;
  }

  ensureBackupRoot() {
    fs.mkdirSync(this.config.backupPath, { recursive: true });
  }

  createManifest() {
    this.ensureBackupRoot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupId = `bar-radio-backup-${timestamp}`;
    const manifest = {
      backupId,
      createdAt: new Date().toISOString(),
      sources: this.sources(),
      destination: path.join(this.config.backupPath, backupId),
    };
    fs.writeFileSync(path.join(this.config.backupPath, `${backupId}.json`), JSON.stringify(manifest, null, 2), "utf8");
    return manifest;
  }

  restorePlan(backupId = "") {
    return {
      backupId,
      safeMode: true,
      steps: [
        "Stop bar-radio service",
        "Copy config backup",
        "Restore cache folders",
        "Restore media folders",
        "Start bar-radio service",
        "Run deploy health",
      ],
    };
  }

  sources() {
    return [
      path.join(this.config.projectRoot, "config"),
      path.join(this.config.cachePath, "library-cache.json"),
      path.join(this.config.storagePath, "media", "covers"),
      path.join(this.config.storagePath, "media", "cache"),
      path.join(this.config.serverRoot, "cache", "metadata-cache.json"),
      path.join(this.config.serverRoot, "playlists"),
    ];
  }
}
