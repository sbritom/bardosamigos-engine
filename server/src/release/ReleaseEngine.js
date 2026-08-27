import fs from "node:fs";
import path from "node:path";
import { MigrationManager } from "./MigrationManager.js";
import { ReleaseHealth } from "./ReleaseHealth.js";
import { ReleaseReport } from "./ReleaseReport.js";
import { ReleaseValidator } from "./ReleaseValidator.js";
import { VersionManager } from "./VersionManager.js";

export class ReleaseEngine {
  constructor({ engine, logger = null }) {
    this.engine = engine;
    this.logger = logger;
    this.versionManager = new VersionManager();
    this.health = new ReleaseHealth(engine);
    this.migrations = new MigrationManager(engine);
    this.validator = new ReleaseValidator({
      versionManager: this.versionManager,
      releaseHealth: this.health,
      migrationManager: this.migrations,
    });
    this.reporter = new ReleaseReport({
      engine,
      versionManager: this.versionManager,
      validator: this.validator,
    });
  }

  init() {
    fs.mkdirSync(path.resolve("server/storage/release"), { recursive: true });
    ["release.log", "validation.log", "startup-report.log"].forEach((file) => {
      const filePath = path.resolve("server/logs", file);
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "", "utf8");
    });
    this.logger?.info("release", "Release Engine initialized.", this.version());
    return this.status();
  }

  status() {
    return {
      version: this.version(),
      validation: this.validator.validate(),
      checkedAt: new Date().toISOString(),
    };
  }

  report() {
    const report = this.reporter.generate();
    this.logger?.info("release", "Release report generated.", { version: report.version.version });
    return report;
  }

  version() {
    return this.versionManager.getVersion();
  }

  check() {
    const status = this.status();
    const report = this.report();
    return {
      ...status,
      reportPath: this.reporter.reportPath,
      report,
    };
  }
}
