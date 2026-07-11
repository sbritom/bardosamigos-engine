export class ReleaseValidator {
  constructor({ versionManager, releaseHealth, migrationManager }) {
    this.versionManager = versionManager;
    this.releaseHealth = releaseHealth;
    this.migrationManager = migrationManager;
  }

  validate() {
    const version = this.versionManager.getVersion();
    const health = this.releaseHealth.run();
    const migrations = this.migrationManager.status();
    const warnings = [];
    const errors = [];

    if (!version.semver.valid) errors.push("Invalid SemVer version.");
    if (health.status === "WARN") warnings.push("Global health has warnings.");
    if (health.status === "FAIL") errors.push("Global health has failures.");
    if (migrations.pending.length) warnings.push("Pending migrations detected.");

    return {
      ready: errors.length === 0,
      status: errors.length ? "FAIL" : warnings.length ? "WARN" : "OK",
      version,
      health,
      migrations,
      warnings,
      errors,
      checkedAt: new Date().toISOString(),
    };
  }
}
