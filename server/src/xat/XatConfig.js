import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..", "..", "..");

const DEFAULT_XAT_CONFIG = Object.freeze({
  enabled: true,
  host: "localhost",
  port: 8000,
  mount: "/radio",
  protocol: "http",
  widgetRefresh: 5000,
  theme: "bar-dark",
});

function normalizeMount(mount) {
  if (!mount) return "/radio";
  return mount.startsWith("/") ? mount : `/${mount}`;
}

export class XatConfig {
  constructor({ env = process.env, radioConfig = null } = {}) {
    this.env = env;
    this.radioConfig = radioConfig;
  }

  load() {
    const fileConfig = this.readFileConfig();
    const streamConfig = this.radioConfig?.stream || {};

    return {
      ...DEFAULT_XAT_CONFIG,
      ...fileConfig,
      enabled: this.env.XAT_ENABLED ? this.env.XAT_ENABLED === "true" : fileConfig.enabled ?? DEFAULT_XAT_CONFIG.enabled,
      host: this.env.XAT_HOST || fileConfig.host || streamConfig.host || DEFAULT_XAT_CONFIG.host,
      port: Number(this.env.XAT_PORT || fileConfig.port || streamConfig.port || DEFAULT_XAT_CONFIG.port),
      mount: normalizeMount(this.env.XAT_MOUNT || fileConfig.mount || streamConfig.mount || DEFAULT_XAT_CONFIG.mount),
      protocol: this.env.XAT_PROTOCOL || fileConfig.protocol || streamConfig.protocol || DEFAULT_XAT_CONFIG.protocol,
      widgetRefresh: Number(this.env.XAT_WIDGET_REFRESH || fileConfig.widgetRefresh || DEFAULT_XAT_CONFIG.widgetRefresh),
      theme: this.env.XAT_THEME || fileConfig.theme || DEFAULT_XAT_CONFIG.theme,
    };
  }

  readFileConfig() {
    const filePath = path.join(projectRoot, "config", "xat.json");
    if (!fs.existsSync(filePath)) return {};

    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return {};
    }
  }
}
