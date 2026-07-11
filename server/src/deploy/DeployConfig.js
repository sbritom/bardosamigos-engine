import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..", "..", "..");

const DEFAULT_DEPLOY_CONFIG = Object.freeze({
  environment: "production",
  serverName: "bar-radio-server",
  domain: "",
  streamHost: "localhost",
  streamPort: 8000,
  mount: "/radio",
  apiPort: 3333,
  playerPort: 5173,
  publicUrl: "",
  ssl: {
    enabled: false,
    provider: "",
    email: "",
  },
});

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function normalizeMount(mount) {
  if (!mount) return "/radio";
  return mount.startsWith("/") ? mount : `/${mount}`;
}

export class DeployConfig {
  constructor({ env = process.env } = {}) {
    this.env = env;
  }

  load() {
    const fileConfig = readJson(path.join(projectRoot, "config", "deploy.json"));
    const config = {
      ...DEFAULT_DEPLOY_CONFIG,
      ...fileConfig,
      ssl: {
        ...DEFAULT_DEPLOY_CONFIG.ssl,
        ...(fileConfig.ssl || {}),
      },
      environment: this.env.DEPLOY_ENVIRONMENT || fileConfig.environment || DEFAULT_DEPLOY_CONFIG.environment,
      serverName: this.env.DEPLOY_SERVER_NAME || fileConfig.serverName || DEFAULT_DEPLOY_CONFIG.serverName,
      domain: this.env.DEPLOY_DOMAIN || fileConfig.domain || DEFAULT_DEPLOY_CONFIG.domain,
      streamHost: this.env.DEPLOY_STREAM_HOST || fileConfig.streamHost || DEFAULT_DEPLOY_CONFIG.streamHost,
      streamPort: Number(this.env.DEPLOY_STREAM_PORT || fileConfig.streamPort || DEFAULT_DEPLOY_CONFIG.streamPort),
      mount: normalizeMount(this.env.DEPLOY_MOUNT || fileConfig.mount || DEFAULT_DEPLOY_CONFIG.mount),
      apiPort: Number(this.env.DEPLOY_API_PORT || fileConfig.apiPort || DEFAULT_DEPLOY_CONFIG.apiPort),
      playerPort: Number(this.env.DEPLOY_PLAYER_PORT || fileConfig.playerPort || DEFAULT_DEPLOY_CONFIG.playerPort),
      publicUrl: this.env.DEPLOY_PUBLIC_URL || fileConfig.publicUrl || DEFAULT_DEPLOY_CONFIG.publicUrl,
    };

    return {
      ...config,
      projectRoot,
      serverRoot: path.join(projectRoot, "server"),
      configPath: path.join(projectRoot, "config"),
      logsPath: path.join(projectRoot, "server", "logs"),
      storagePath: path.join(projectRoot, "server", "storage"),
      backupPath: path.join(projectRoot, "server", "backups"),
      cachePath: path.join(projectRoot, "server", "cache"),
    };
  }
}
