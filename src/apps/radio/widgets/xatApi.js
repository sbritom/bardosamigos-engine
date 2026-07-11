import { radioApiConfig } from "../../../modules/radio/config/radioApiConfig";

const BASE_URL = radioApiConfig.apiBaseUrl?.replace(/\/$/, "") || "";

function buildUrl(path) {
  return `${BASE_URL}${path}`;
}

async function getJson(path, { signal } = {}) {
  const response = await fetch(buildUrl(path), {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`Xat API ${response.status}`);
  const payload = await response.json();
  return payload?.data ?? payload;
}

export async function loadXatWidgetData({ signal } = {}) {
  const [nowPlaying, status, stream, widget] = await Promise.allSettled([
    getJson("/engine/player/nowplaying", { signal }),
    getJson("/engine/player/status", { signal }),
    getJson("/engine/xat/stream", { signal }),
    getJson("/engine/xat/widget", { signal }),
  ]);

  return {
    nowPlaying: nowPlaying.status === "fulfilled" ? nowPlaying.value : null,
    status: status.status === "fulfilled" ? status.value : { status: "offline" },
    stream: stream.status === "fulfilled" ? stream.value : null,
    widget: widget.status === "fulfilled" ? widget.value : null,
    hasError: [nowPlaying, status, stream, widget].some((item) => item.status === "rejected"),
    updatedAt: new Date().toISOString(),
  };
}

export function coverUrl(track, size = 128) {
  const id = encodeURIComponent(track?.id || "default");
  return buildUrl(`/engine/covers/${id}/${size}`);
}
