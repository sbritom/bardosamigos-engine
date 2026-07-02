export function parseTrackTitle(rawTitle = "") {
  const normalized = String(rawTitle).trim();

  if (!normalized) {
    return {
      title: "Programacao ao vivo",
      artist: "Radio Bar dos Amigos",
      album: "",
      category: "",
      year: null,
      bitrate: "",
      duration: 0,
      image: "",
    };
  }

  const [artist, title] = normalized.includes(" - ")
    ? normalized.split(" - ", 2).map((part) => part.trim())
    : ["Radio Bar dos Amigos", normalized];

  return {
    title: title || normalized,
    artist: artist || "Radio Bar dos Amigos",
    album: "",
    category: "",
    year: null,
    bitrate: "",
    duration: 0,
    image: "",
  };
}

export function normalizeTrackMetadata(metadata = {}) {
  return {
    title: metadata.title || "Sem titulo",
    artist: metadata.artist || "Artista nao identificado",
    album: metadata.album || "",
    category: metadata.category || metadata.genre || "",
    year: metadata.year || null,
    bitrate: metadata.bitrate || "",
    duration: metadata.duration || 0,
    image: metadata.image || metadata.cover || "",
  };
}
