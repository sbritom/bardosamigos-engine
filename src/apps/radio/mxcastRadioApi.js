const OFFICIAL_STREAM_URL = "https://s01.svrdedicado.org:7956/stream";
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
      track: "Programação ao vivo",
      artist: "IMORTAL0800",
    };
  }

  const separators = [" - ", " – ", " — ", " | ", " / "];

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
    artist: "IMORTAL0800",
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
    statusLabel: data.statusLabel || "",
    songTitle: data.songTitle || "",
    track: parsed.track,
    artist: parsed.artist,
    listeners: Number(data.listeners) || 0,
    listenerLimit: Number(data.listenerLimit) || 0,
    peakListeners: Number(data.peakListeners) || 0,
    bitrate: Number(data.bitrate) || 0,
    bitrateLabel: data.bitrateLabel || "",
    genre: data.genre || "",
    serverTitle: data.serverTitle || "IMORTAL0800",
    streamUrl: data.streamUrl || OFFICIAL_STREAM_URL,
    cover: data.cover || "",
    provider: data.provider || "",
    protocol: data.protocol || "",
    fallbackActive: Boolean(data.fallbackActive),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}
