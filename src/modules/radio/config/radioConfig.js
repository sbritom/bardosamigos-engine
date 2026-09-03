export const RADIO_NAME = "Rádio IMORTAL0800";
export const RADIO_SLOGAN = "Som que não para.";
export const RADIO_STREAM_URL = "https://s01.svrdedicado.org:7956/stream";
export const RADIO_STATUS_URL = "/api/radio/stats";

export const RADIO_BRAND = Object.freeze({
  primaryColor: "#191970",
  secondaryColor: "#f59e0b",
  theme: "dark",
  language: "pt-BR",
  defaultVolume: 70,
});

export const RADIO_STREAMING_TYPES = Object.freeze({ ICECAST: "icecast", SHOUTCAST: "shoutcast", EXTERNAL: "external" });
export const RADIO_ADMIN_SECTIONS = Object.freeze([
  { id: "dashboard", label: "Dashboard" }, { id: "library", label: "Biblioteca" },
  { id: "upload", label: "Upload" }, { id: "categories", label: "Categorias" },
  { id: "playlists", label: "Playlists" }, { id: "schedule", label: "Programação" },
  { id: "streaming", label: "Streaming" }, { id: "listeners", label: "Ouvintes" },
  { id: "stats", label: "Estatísticas" }, { id: "logs", label: "Logs" },
  { id: "settings", label: "Configurações" },
]);

export const DEFAULT_CATEGORIES = Object.freeze([
  "Sertanejo", "Forró", "Arrocha", "Piseiro", "Pagode", "Pop", "Rock", "Flashback",
  "Internacional", "Anos 80", "Anos 90", "Anos 2000", "Eletrônica", "Futebol",
  "Vinhetas", "Institucionais", "Hora Certa", "Comerciais",
]);

export const DEFAULT_AUTODJ_SETTINGS = Object.freeze({
  shuffle: true, avoidSameArtist: true, avoidSameTrack: true,
  minArtistIntervalMinutes: 45, minTrackIntervalMinutes: 180,
  insertJingles: true, insertAds: false, insertTimeSignal: true,
  autoVolume: true, crossfade: true, fadeIn: true, fadeOut: true, silenceDetection: true,
});
