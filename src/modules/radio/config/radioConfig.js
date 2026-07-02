export const RADIO_NAME = "Radio Bar dos Amigos";
export const RADIO_SLOGAN = "A trilha sonora da nossa amizade";
export const RADIO_STREAM_URL = "";
export const RADIO_STATUS_URL = "";

export const RADIO_BRAND = Object.freeze({
  primaryColor: "#191970",
  secondaryColor: "#f59e0b",
  theme: "dark",
  language: "pt-BR",
  defaultVolume: 70,
});

export const RADIO_STREAMING_TYPES = Object.freeze({
  ICECAST: "icecast",
  SHOUTCAST: "shoutcast",
  EXTERNAL: "external",
});

export const RADIO_ADMIN_SECTIONS = Object.freeze([
  { id: "dashboard", label: "Dashboard" },
  { id: "library", label: "Biblioteca" },
  { id: "upload", label: "Upload" },
  { id: "categories", label: "Categorias" },
  { id: "playlists", label: "Playlists" },
  { id: "schedule", label: "Programacao" },
  { id: "streaming", label: "Streaming" },
  { id: "listeners", label: "Ouvintes" },
  { id: "stats", label: "Estatisticas" },
  { id: "logs", label: "Logs" },
  { id: "settings", label: "Configuracoes" },
]);

export const DEFAULT_CATEGORIES = Object.freeze([
  "Sertanejo",
  "Forro",
  "Arrocha",
  "Piseiro",
  "Pagode",
  "Pop",
  "Rock",
  "Flashback",
  "Internacional",
  "Anos 80",
  "Anos 90",
  "Anos 2000",
  "Eletronica",
  "Futebol",
  "Vinhetas",
  "Institucionais",
  "Hora Certa",
  "Comerciais",
]);

export const DEFAULT_AUTODJ_SETTINGS = Object.freeze({
  shuffle: true,
  avoidSameArtist: true,
  avoidSameTrack: true,
  minArtistIntervalMinutes: 45,
  minTrackIntervalMinutes: 180,
  insertJingles: true,
  insertAds: false,
  insertTimeSignal: true,
  autoVolume: true,
  crossfade: true,
  fadeIn: true,
  fadeOut: true,
  silenceDetection: true,
});
