export const RADIO_API_BASE_URL = import.meta.env.VITE_RADIO_API_BASE_URL || "";
export const RADIO_STREAM_URL = import.meta.env.VITE_RADIO_STREAM_URL || "";
export const RADIO_STATUS_URL = import.meta.env.VITE_RADIO_STATUS_URL || "";
export const USE_MOCKS = import.meta.env.VITE_RADIO_USE_MOCKS === "true";
export const POLLING_INTERVAL = Number(import.meta.env.VITE_RADIO_POLLING_INTERVAL || 5000);

export const radioApiConfig = Object.freeze({
  apiBaseUrl: RADIO_API_BASE_URL,
  streamUrl: RADIO_STREAM_URL,
  statusUrl: RADIO_STATUS_URL,
  useMocks: USE_MOCKS,
  pollingInterval: POLLING_INTERVAL,
});
