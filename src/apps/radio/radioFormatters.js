export function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatBitrate(value) {
  if (!value) return "Bitrate indisponivel";
  return `${Math.round(Number(value) / (Number(value) > 1000 ? 1000 : 1))} kbps`;
}

export function formatCount(value, singular, plural) {
  const count = Number(value || 0);
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getTrackTitle(track) {
  return track?.title || track?.metadata?.title || "Musica nao informada";
}

export function getTrackArtist(track) {
  return track?.artist || track?.metadata?.artist || "Artista desconhecido";
}

export function getTrackAlbum(track) {
  return track?.album || track?.metadata?.album || "Album nao informado";
}

export function getTrackGenre(track) {
  return track?.genre || track?.metadata?.genre || "Genero nao informado";
}

export function getStatusTone(value) {
  const normalized = String(value || "").toLowerCase();
  if (["online", "ok", "ready", "playing", "streaming", "healthy", "connected", "active"].includes(normalized)) {
    return "ok";
  }
  if (["warning", "idle", "loading", "buffering", "pending", "unknown"].includes(normalized)) {
    return "warn";
  }
  return "error";
}
