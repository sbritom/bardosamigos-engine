const OFFICIAL_STREAM_URL = "https://stm1.mxcast.com.br:7186/stream";
const METADATA_REFRESH_INTERVAL = 15000;

function getMetadataUrl() {
  return import.meta.env.DEV
    ? "http://localhost:3333/engine/radio/mxcast/status"
    : "/api/radio/stats";
}

function parseSongTitle(rawTitle) {
  const title = String(rawTitle || "").trim();

  if (!title) {
    return {
      track: "Programacao ao vivo",
      artist: "Radio Bar dos Amigos",
    };
  }

  const separators = [" - ", " \u2013 ", " \u2014 ", " | ", " / "];

  for (const separator of separators) {
    if (title.includes(separator)) {
      const [artist, ...trackParts] = title.split(separator);
      const track = trackParts.join(separator).trim();

      if (artist.trim() && track) {
        return {
          artist: artist.trim(),
          track,
        };
      }
    }
  }

  return {
    track: title,
    artist: "Radio Bar dos Amigos",
  };
}

export function getMxCastStreamUrl() {
  return OFFICIAL_STREAM_URL;
}

export function getRadioMetadataEndpoint() {
  return getMetadataUrl();
}

export function getRadioMetadataInterval() {
  return METADATA_REFRESH_INTERVAL;
}

export async function fetchMxCastStatus({ signal } = {}) {
  const response = await fetch(getMetadataUrl(), {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Radio metadata request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const data = payload?.data || payload || {};
  const parsed = parseSongTitle(data.songTitle);

  return {
    online: Boolean(data.online),
    songTitle: data.songTitle || "",
    track: parsed.track,
    artist: parsed.artist,
    listeners: Number(data.listeners) || 0,
    peakListeners: Number(data.peakListeners) || 0,
    serverTitle: data.serverTitle || "Radio Bar dos Amigos",
    streamUrl: data.streamUrl || OFFICIAL_STREAM_URL,
    cover: data.cover || "",
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}
