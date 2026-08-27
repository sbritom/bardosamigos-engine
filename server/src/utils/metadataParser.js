export function parseStreamTitle(streamTitle = "") {
  const normalized = String(streamTitle).trim();
  const [artist, title] = normalized.includes(" - ")
    ? normalized.split(" - ", 2).map((part) => part.trim())
    : ["Radio Bar dos Amigos", normalized || "Programacao ao vivo"];

  return {
    title,
    artist,
    album: "",
    category: "",
    year: null,
    bitrate: "",
    duration: 0,
    image: "",
  };
}

export function normalizeMetadata(metadata = {}) {
  return {
    title: metadata.title || "Programacao ao vivo",
    artist: metadata.artist || "Radio Bar dos Amigos",
    album: metadata.album || "",
    category: metadata.category || metadata.genre || "",
    year: metadata.year || null,
    bitrate: metadata.bitrate || "",
    duration: metadata.duration || 0,
    image: metadata.image || metadata.cover || "",
  };
}
