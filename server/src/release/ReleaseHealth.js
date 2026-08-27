import fs from "node:fs";
import path from "node:path";

export class ReleaseHealth {
  constructor(engine) {
    this.engine = engine;
  }

  run() {
    const health = this.engine.healthEngine?.run?.();
    const deploy = this.engine.deploy?.status?.();
    const status = this.engine.getStatus();
    const modules = {
      node: this.ok(Boolean(process.version), process.version),
      npm: this.ok(Boolean(deploy?.system?.npm?.ok), deploy?.system?.npm?.version),
      icecast: this.fromHealth(health?.modules?.icecast),
      ffmpeg: this.fromHealth(health?.modules?.ffmpeg),
      stream: this.fromHealth(health?.modules?.stream),
      queue: this.fromHealth(health?.modules?.queue),
      scheduler: this.fromHealth(health?.modules?.scheduler),
      autodj: this.fromHealth(health?.modules?.autodj),
      library: this.fromHealth(health?.modules?.library),
      metadata: this.fromHealth(health?.modules?.metadata),
      cover: this.fromHealth(health?.modules?.cover),
      player: this.fromHealth(health?.modules?.player),
      audience: this.ok(Boolean(this.engine.audience), "Audience Engine ready"),
      programming: this.warn("Programming Engine not present; scheduler is available."),
      deploy: this.ok(Boolean(this.engine.deploy), "Deploy Engine ready"),
      storage: this.fromHealth(health?.modules?.storage),
      api: this.fromHealth(health?.modules?.api),
      cache: this.fromHealth(health?.modules?.cache),
      filesystem: this.ok(fs.existsSync(path.resolve("server/storage")), "server/storage ready"),
    };
    const warnings = Object.values(modules).filter((item) => item.level === "WARN");
    const failures = Object.values(modules).filter((item) => item.level === "FAIL");

    return {
      status: failures.length ? "FAIL" : warnings.length ? "WARN" : "OK",
      modules,
      statusSnapshot: status,
      warnings: warnings.length,
      failures: failures.length,
      checkedAt: new Date().toISOString(),
    };
  }

  fromHealth(item) {
    if (!item) return this.fail("Unavailable");
    if (item.status === "OK") return this.ok(true, item.details || item.name);
    if (item.status === "WARN") return this.warn(item.details || item.name);
    return this.fail(item.lastError || item.details || item.name);
  }

  ok(condition, detail) {
    return {
      ok: Boolean(condition),
      level: condition ? "OK" : "FAIL",
      detail,
    };
  }

  warn(detail) {
    return {
      ok: false,
      level: "WARN",
      detail,
    };
  }

  fail(detail) {
    return {
      ok: false,
      level: "FAIL",
      detail,
    };
  }
}
