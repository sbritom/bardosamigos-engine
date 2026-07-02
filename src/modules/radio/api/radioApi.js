import { radioApiConfig } from "../config";
import { radioInitialState } from "../store/radioMocks";

const nowPlayingFallback = {
  current: radioInitialState.tracks[0],
  next: radioInitialState.tracks[1],
  history: radioInitialState.tracks.slice(1, 4),
  remainingSeconds: radioInitialState.status.remainingSeconds,
};

const fallbackByEndpoint = {
  "/engine/status": radioInitialState.status,
  "/engine/nowplaying": nowPlayingFallback,
  "/engine/history": radioInitialState.tracks.slice(1, 4),
  "/engine/library": radioInitialState.tracks,
  "/engine/config": radioInitialState.config,
  "/engine/stream": radioInitialState.status,
  "/engine/audio": { queue: [], next: null, encoder: {}, ffmpeg: {} },
  "/engine/icecast": { connected: false },
  "/api/radio/status": radioInitialState.status,
  "/api/radio/nowplaying": nowPlayingFallback,
  "/api/radio/history": radioInitialState.tracks.slice(1, 4),
  "/api/radio/playlists": radioInitialState.playlists,
  "/api/radio/schedule": radioInitialState.schedule,
  "/api/radio/categories": radioInitialState.categories,
  "/api/radio/library": radioInitialState.tracks,
  "/api/radio/config": radioInitialState.config,
  "/api/radio/listeners": radioInitialState.listeners,
  "/api/radio/stats": {
    mostPlayed: radioInitialState.tracks.slice(0, 3),
    topArtists: ["Banda do Bar", "Arena Brasil", "DJ Midnight"],
    topCategories: ["Pagode", "Sertanejo", "Flashback"],
    uploads: radioInitialState.tracks.length,
    downloads: 0,
    totalBroadcastHours: 128,
    audienceGrowth: 18,
  },
  "/api/radio/logs": radioInitialState.logs,
};

function getOrigin() {
  return globalThis.location?.origin || "http://localhost:5173";
}

function createUrl(path, params = {}) {
  const baseUrl = radioApiConfig.apiBaseUrl || "";
  const url = new URL(`${baseUrl}${path}`, getOrigin());

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function request(path, options = {}) {
  const fallback = fallbackByEndpoint[path] ?? null;

  if (radioApiConfig.useMocks) {
    return { data: fallback, error: null, fallback: true, mocked: true };
  }

  try {
    const response = await fetch(createUrl(path, options.params), {
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Radio API failed with ${response.status}`);
    }

    const payload = await response.json();
    return { data: payload.data ?? payload, error: null, fallback: false, mocked: false };
  } catch (error) {
    return { data: fallback, error, fallback: true, mocked: false };
  }
}

export const radioApi = {
  getDashboard(options) {
    return request("/engine/status", options);
  },
  getStatus(options) {
    return request("/engine/status", options);
  },
  getStream(options) {
    return request("/engine/stream", options);
  },
  getAudio(options) {
    return request("/engine/audio", options);
  },
  getIcecast(options) {
    return request("/engine/icecast", options);
  },
  getNowPlaying(options) {
    return request("/engine/nowplaying", options);
  },
  getHistory(options) {
    return request("/engine/history", options);
  },
  listTracks(params = {}, options = {}) {
    return request("/engine/library", { ...options, params });
  },
  listCategories(options) {
    return request("/api/radio/categories", options);
  },
  listPlaylists(options) {
    return request("/api/radio/playlists", options);
  },
  listSchedule(options) {
    return request("/api/radio/schedule", options);
  },
  listListeners(options) {
    return request("/api/radio/listeners", options);
  },
  getStats(options) {
    return request("/api/radio/stats", options);
  },
  listLogs(options) {
    return request("/api/radio/logs", options);
  },
  getConfig(options) {
    return request("/engine/config", options);
  },
};
