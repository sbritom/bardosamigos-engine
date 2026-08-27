import fs from "node:fs";

export class DeployValidator {
  constructor({ config, system, radioStatus = null } = {}) {
    this.config = config;
    this.system = system;
    this.radioStatus = radioStatus;
  }

  validate() {
    const checks = {
      node: this.ok(this.system.node.ok, this.system.node.version),
      npm: this.ok(this.system.npm.ok, this.system.npm.version),
      ffmpeg: this.ok(this.system.ffmpeg.ok, this.system.ffmpeg.version),
      icecast: this.warn(this.system.icecast.ok, this.system.icecast.version || "Icecast not found in PATH"),
      git: this.ok(this.system.git.ok, this.system.git.version),
      curl: this.ok(this.system.curl.ok, this.system.curl.version),
      systemd: this.warn(this.system.systemd.ok, this.system.systemd.version || "systemd available only on Linux servers"),
      player: this.ok(Boolean(this.radioStatus?.player || this.radioStatus?.nowPlaying !== undefined), "Player engine reachable"),
      api: this.ok(Boolean(this.radioStatus?.apiPort || this.config.apiPort), `API port ${this.config.apiPort}`),
      library: this.ok(Boolean(this.radioStatus?.libraryPathFound), this.radioStatus?.libraryPath || "Library path not found"),
      metadata: this.ok(Boolean(this.radioStatus?.libraryManager), "Metadata manager ready"),
      cover: this.ok(fs.existsSync(`${this.config.storagePath}/media/covers`) || fs.existsSync(`${this.config.storagePath}/media`), "Cover storage prepared"),
      storage: this.ok(fs.existsSync(this.config.storagePath), this.config.storagePath),
      cache: this.ok(fs.existsSync(this.config.cachePath) || fs.existsSync(`${this.config.serverRoot}/cache`), "Cache folder prepared"),
    };
    const values = Object.values(checks);
    const failed = values.filter((item) => item.level === "FAIL").length;
    const warnings = values.filter((item) => item.level === "WARN").length;

    return {
      status: failed ? "FAIL" : warnings ? "WARN" : "OK",
      checks,
      failed,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  }

  ok(condition, detail) {
    return {
      ok: Boolean(condition),
      level: condition ? "OK" : "FAIL",
      detail,
    };
  }

  warn(condition, detail) {
    return {
      ok: Boolean(condition),
      level: condition ? "OK" : "WARN",
      detail,
    };
  }
}
