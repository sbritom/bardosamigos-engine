import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..", "..", "..");

const DEFAULT_RELEASE = Object.freeze({
  version: "1.0.0-rc.1",
  releaseDate: "2026-07-07",
  environment: "release-candidate",
  buildNumber: "20260707.1",
  apiVersion: "v1",
  minimumNode: "20.9.0",
  minimumFFmpeg: "6.0.0",
  minimumIcecast: "2.4.0",
});

export class VersionManager {
  constructor({ configPath = path.join(projectRoot, "config", "release.json") } = {}) {
    this.configPath = configPath;
  }

  getVersion() {
    return {
      ...DEFAULT_RELEASE,
      ...this.readConfig(),
      semver: this.parseSemver(this.readConfig().version || DEFAULT_RELEASE.version),
      checkedAt: new Date().toISOString(),
    };
  }

  readConfig() {
    if (!fs.existsSync(this.configPath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.configPath, "utf8"));
    } catch {
      return {};
    }
  }

  parseSemver(version) {
    const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
    return {
      valid: Boolean(match),
      major: Number(match?.[1] || 0),
      minor: Number(match?.[2] || 0),
      patch: Number(match?.[3] || 0),
    };
  }
}
