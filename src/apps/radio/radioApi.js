import { radioApiConfig } from "../../modules/radio/config/radioApiConfig";

const API_PATHS = {
  state: "/engine/player/state",
  status: "/engine/player/status",
  history: "/engine/player/history",
  next: "/engine/player/next",
  nowPlaying: "/engine/player/nowplaying",
  health: "/engine/health",
};

const DEFAULT_STATE = {
  currentTrack: null,
  previousTrack: null,
  nextTrack: null,
  elapsed: 0,
  remaining: 0,
  duration: 0,
  listeners: 0,
  status: "offline",
  volume: 0.8,
  startedAt: null,
  updatedAt: null,
  cover: { fallback: "/engine/covers/default", available: false, sizes: {} },
  metadata: null,
};

const DEFAULT_STATUS = {
  online: false,
  status: "offline",
  stream: "offline",
  icecast: "unknown",
  ffmpeg: "unknown",
  autodj: "unknown",
  scheduler: "unknown",
  player: "offline",
  metadata: "unknown",
  cover: "unknown",
  library: "unknown",
  api: "offline",
};

function getApiBaseUrl() {
  return radioApiConfig.apiBaseUrl || "";
}

function buildUrl(path) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  return `${baseUrl}${path}`;
}

async function fetchJson(path, { signal } = {}) {
  const response = await fetch(buildUrl(path), {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Radio API ${response.status} em ${path}`);
  }

  return response.json();
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.history)) return value.history;
  if (Array.isArray(value?.tracks)) return value.tracks;
  return [];
}

function normalizeState(value) {
  if (!value || typeof value !== "object") return DEFAULT_STATE;
  return {
    ...DEFAULT_STATE,
    ...value,
    cover: {
      ...DEFAULT_STATE.cover,
      ...(value.cover || {}),
      sizes: {
        ...(DEFAULT_STATE.cover.sizes || {}),
        ...(value.cover?.sizes || {}),
      },
    },
  };
}

function normalizeStatus(value) {
  if (!value || typeof value !== "object") return DEFAULT_STATUS;
  return {
    ...DEFAULT_STATUS,
    ...value,
    online: Boolean(value.online || value.status === "online" || value.status === "playing"),
    api: "online",
  };
}

function normalizeHealth(value) {
  if (!value || typeof value !== "object") return null;
  return value;
}

export async function loadRadioDashboard({ signal } = {}) {
  const results = await Promise.allSettled([
    fetchJson(API_PATHS.state, { signal }),
    fetchJson(API_PATHS.status, { signal }),
    fetchJson(API_PATHS.history, { signal }),
    fetchJson(API_PATHS.next, { signal }),
    fetchJson(API_PATHS.nowPlaying, { signal }),
    fetchJson(API_PATHS.health, { signal }),
  ]);

  const [stateResult, statusResult, historyResult, nextResult, nowPlayingResult, healthResult] = results;
  const failed = results.some((result) => result.status === "rejected");

  const state = normalizeState(stateResult.status === "fulfilled" ? stateResult.value : null);
  const status = normalizeStatus(statusResult.status === "fulfilled" ? statusResult.value : null);
  const history = normalizeArray(historyResult.status === "fulfilled" ? historyResult.value : null);
  const next = nextResult.status === "fulfilled" ? nextResult.value?.track || nextResult.value : state.nextTrack;
  const nowPlaying = nowPlayingResult.status === "fulfilled" ? nowPlayingResult.value : state.currentTrack;
  const health = normalizeHealth(healthResult.status === "fulfilled" ? healthResult.value : null);

  return {
    state,
    status,
    history,
    next,
    nowPlaying,
    health,
    error: failed ? "Alguns dados da Radio API nao responderam. Exibindo modo seguro." : null,
    updatedAt: new Date().toISOString(),
  };
}

export function getCoverUrl(track, preferredSize = 256) {
  if (!track) return buildUrl("/engine/covers/default");
  const id = encodeURIComponent(track.id || "default");
  return buildUrl(`/engine/covers/${id}/${preferredSize}`);
}

export function getStreamUrl() {
  return radioApiConfig.streamUrl || "";
}

export const RADIO_POLLING_INTERVAL = Math.max(2000, radioApiConfig.pollingInterval || 5000);
