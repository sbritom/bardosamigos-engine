import { HealthChecks } from "./HealthChecks.js";
import { HealthReporter } from "./HealthReporter.js";

export class RadioHealthEngine {
  constructor(engine, logger = null) {
    this.engine = engine;
    this.logger = logger;
    this.checks = new HealthChecks(engine);
    this.reporter = new HealthReporter();
    this.startedAt = new Date().toISOString();
    this.lastReport = null;
    this.version = "9.2.1";
    this.logger?.info("engine", "Health initialized.", { version: this.version });
  }

  run() {
    const report = {
      ...this.checks.runAll(),
      startedAt: this.startedAt,
      version: this.version,
    };
    this.lastReport = report;

    if (report.health === "failed") {
      this.logger?.error("engine", "Health failed.", { status: report.status });
    } else if (report.health === "warning") {
      this.logger?.warn("engine", "Health warning.", { status: report.status });
    } else {
      this.logger?.info("engine", "Health passed.", { status: report.status });
    }

    return report;
  }

  text() {
    return this.reporter.format(this.lastReport || this.run());
  }

  modules() {
    return this.run().modules;
  }

  events() {
    return this.run().events;
  }

  versionInfo() {
    return {
      version: this.version,
      startedAt: this.startedAt,
      checkedAt: new Date().toISOString(),
    };
  }
}
