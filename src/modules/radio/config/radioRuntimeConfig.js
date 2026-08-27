export const radioRuntimeConfig = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_RADIO_API_BASE_URL || "",
  refreshMs: Number(import.meta.env.VITE_RADIO_REFRESH_MS || 15000),
  streamUrl: import.meta.env.VITE_RADIO_STREAM_URL || "",
  statusUrl: import.meta.env.VITE_RADIO_STATUS_URL || "",
  adminUser: import.meta.env.VITE_RADIO_ADMIN_USER || "",
  autoDjEnabled: import.meta.env.VITE_AUTO_DJ_ENABLED === "true",
  useMocks: import.meta.env.VITE_RADIO_USE_MOCKS === "true",
});
