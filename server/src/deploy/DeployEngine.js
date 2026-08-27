import fs from "node:fs";
import path from "node:path";
import { BackupManager } from "./BackupManager.js";
import { DeployConfig } from "./DeployConfig.js";
import { DeployValidator } from "./DeployValidator.js";
import { FirewallManager } from "./FirewallManager.js";
import { ServiceInstaller } from "./ServiceInstaller.js";
import { SystemChecker } from "./SystemChecker.js";

export class DeployEngine {
  constructor({ radioEngine = null, env = process.env, logger = null } = {}) {
    this.config = new DeployConfig({ env }).load();
    this.radioEngine = radioEngine;
    this.logger = logger;
    this.systemChecker = new SystemChecker();
    this.firewall = new FirewallManager(this.config);
    this.backup = new BackupManager(this.config);
    this.serviceInstaller = new ServiceInstaller(this.config);
    this.startedAt = new Date().toISOString();
  }

  ensureDirectories() {
    [
      this.config.logsPath,
      this.config.storagePath,
      this.config.backupPath,
      this.config.cachePath,
      path.join(this.config.storagePath, "media"),
      path.join(this.config.storagePath, "media", "covers"),
      path.join(this.config.storagePath, "media", "cache"),
    ].forEach((folder) => fs.mkdirSync(folder, { recursive: true }));

    ["deploy.log", "startup.log", "shutdown.log", "health.log"].forEach((fileName) => {
      const filePath = path.join(this.config.logsPath, fileName);
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "", "utf8");
    });
  }

  status() {
    this.ensureDirectories();
    const system = this.systemChecker.check();
    const radioStatus = this.radioEngine?.getStatus?.() || null;
    const validation = new DeployValidator({ config: this.config, system, radioStatus }).validate();
    const status = {
      deploy: validation.status,
      release: this.radioEngine?.release?.version?.() || null,
      environment: this.config.environment,
      serverName: this.config.serverName,
      publicUrl: this.config.publicUrl,
      ssl: this.config.ssl,
      system,
      validation,
      performance: this.performance(system),
      checkedAt: new Date().toISOString(),
    };
    this.logger?.info("deploy", "Deploy status checked.", { status: status.deploy });
    return status;
  }

  services() {
    return {
      systemd: this.serviceInstaller.installPlan(),
      firewall: this.firewall.plan(),
      startupOrder: [
        "Icecast starts",
        "Radio Engine starts",
        "Library loads",
        "AutoDJ starts",
        "Player synchronizes",
        "API becomes available",
        "Status ONLINE",
      ],
    };
  }

  version() {
    return {
      name: "Production Deployment Engine",
      version: "9.4.0",
      release: this.radioEngine?.release?.version?.() || null,
      environment: this.config.environment,
      startedAt: this.startedAt,
      checkedAt: new Date().toISOString(),
    };
  }

  check() {
    return {
      config: this.config,
      status: this.status(),
      services: this.services(),
    };
  }

  createBackup() {
    const manifest = this.backup.createManifest();
    this.logger?.info("deploy", "Backup manifest created.", { backupId: manifest.backupId });
    return manifest;
  }

  restorePlan(backupId) {
    return this.backup.restorePlan(backupId);
  }

  performance(system) {
    return {
      cpuCount: system.resources.cpuCount,
      totalMemoryMb: system.resources.totalMemoryMb,
      freeMemoryMb: system.resources.freeMemoryMb,
      uptimeSeconds: system.resources.uptimeSeconds,
      apiResponseTargetMs: 500,
    };
  }
}
