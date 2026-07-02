export const radioConfig = Object.freeze({
  port: Number(process.env.RADIO_SERVER_PORT || process.env.PORT || 3333),
  streamUrl: process.env.RADIO_STREAM_URL || "",
  statusUrl: process.env.RADIO_STATUS_URL || "",
  adminUser: process.env.RADIO_ADMIN_USER || "",
  adminPassword: process.env.RADIO_ADMIN_PASSWORD || "",
  autoDjEnabled: process.env.AUTO_DJ_ENABLED === "true",
  provider: process.env.RADIO_PROVIDER || "external",
  requestTimeoutMs: Number(process.env.RADIO_REQUEST_TIMEOUT_MS || 5000),
});
