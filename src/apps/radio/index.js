export { default as RadioPage } from "./RadioPage";
export { default as XatPreviewPage } from "./XatPreviewPage";
export { default as RadioAdminPage } from "./admin/RadioAdminPage";

export const RADIO_REACT_ROUTES = Object.freeze([
  { path: "/radio", title: "Radio", implemented: true },
  { path: "/radio/player", title: "Player da Radio", implemented: false },
  { path: "/radio/history", title: "Historico da Radio", implemented: false },
  { path: "/radio/library", title: "Biblioteca da Radio", implemented: false },
  { path: "/radio/admin", title: "Admin da Radio", implemented: true },
  { path: "/radio/admin/library", title: "Admin Biblioteca", implemented: false },
  { path: "/radio/admin/logs", title: "Admin Logs", implemented: false },
  { path: "/radio/admin/settings", title: "Admin Configuracoes", implemented: false },
  { path: "/radio/admin/health", title: "Admin Health", implemented: false },
  { path: "/radio/xat", title: "Integracao xat", implemented: true },
]);
