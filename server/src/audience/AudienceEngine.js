import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AudienceStorage } from "./AudienceStorage.js";
import { AudienceStatistics } from "./AudienceStatistics.js";
import { AudienceHistoryEngine } from "./HistoryEngine.js";
import { FavoritesEngine } from "./FavoritesEngine.js";
import { MostPlayedEngine } from "./MostPlayedEngine.js";
import { RequestEngine } from "./RequestEngine.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, "..", "..", "..");

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  allowRequests: true,
  allowDuplicates: false,
  minimumInterval: 60,
  favoritesEnabled: true,
  historyLimit: 1000,
  statisticsLimit: 100,
  storagePath: "server/storage/audience",
});

function readConfig() {
  const filePath = path.join(projectRoot, "config", "audience.json");
  if (!fs.existsSync(filePath)) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(filePath, "utf8")) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export class AudienceEngine {
  constructor({ engine, logger, eventBus }) {
    this.engine = engine;
    this.logger = logger;
    this.eventBus = eventBus;
    this.config = readConfig();
    this.storage = new AudienceStorage({
      storagePath: path.resolve(projectRoot, this.config.storagePath),
    });
  }

  init() {
    this.storage.init();
    this.statistics = new AudienceStatistics({
      storage: this.storage,
      statisticsLimit: this.config.statisticsLimit,
      eventBus: this.eventBus,
      logger: this.logger,
    });
    this.history = new AudienceHistoryEngine({
      storage: this.storage,
      limit: this.config.historyLimit,
    });
    this.favorites = new FavoritesEngine({
      config: this.config,
      storage: this.storage,
      eventBus: this.eventBus,
      logger: this.logger,
    });
    this.mostPlayed = new MostPlayedEngine({
      storage: this.storage,
      limit: this.config.statisticsLimit,
    });
    this.requests = new RequestEngine({
      config: this.config,
      storage: this.storage,
      libraryManager: this.engine.libraryManager,
      logger: this.logger,
      eventBus: this.eventBus,
    });
    this.requests.init();
    this.bindEvents();
    this.logger?.info("audience", "Audience Engine initialized.", this.summary());
    return this.summary();
  }

  bindEvents() {
    if (this.bound) return;
    this.bound = true;
    this.eventBus?.on("musicStarted", ({ track }) => this.recordPlayback(track));
    this.eventBus?.on("listenerUpdate", ({ listeners } = {}) => this.statistics.updateAudience(listeners));
  }

  recordPlayback(track) {
    if (!track) return;
    this.history.record(track);
    this.statistics.recordTrack(track);
    this.mostPlayed.record(track);
    this.requests.markPlayed(track.id);
    this.updateAudienceFromIcecast();
  }

  updateAudienceFromIcecast() {
    const icecast = this.engine.icecast?.status?.() || {};
    return this.statistics.updateAudience(icecast.listeners || icecast.lastDebug?.listeners || 0);
  }

  summary() {
    return {
      enabled: this.config.enabled,
      requests: this.requests?.list?.() || { items: [] },
      statistics: this.statistics?.get?.() || {},
      audience: this.updateAudienceFromIcecast(),
      history: this.history?.list?.(10) || { items: [] },
      mostPlayed: this.mostPlayed?.list?.(10) || { tracks: [] },
      favorites: this.favorites?.get?.() || {},
      updatedAt: new Date().toISOString(),
    };
  }
}
