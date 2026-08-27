import { radioApiConfig } from "../../../modules/radio/config/radioApiConfig";

const BASE_URL = radioApiConfig.apiBaseUrl?.replace(/\/$/, "") || "";
const POLLING_INTERVAL = Math.max(3000, radioApiConfig.pollingInterval || 5000);

function buildUrl(path) {
  return `${BASE_URL}${path}`;
}

async function request(path, { signal } = {}) {
  const response = await fetch(buildUrl(path), {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`Admin API ${response.status}`);
  const payload = await response.json();
  return payload?.data ?? payload;
}

export async function loadAdminDashboard({ signal } = {}) {
  const [dashboard, storage, system, config, logs] = await Promise.allSettled([
    request("/engine/admin/dashboard", { signal }),
    request("/engine/admin/storage", { signal }),
    request("/engine/admin/system", { signal }),
    request("/engine/admin/config", { signal }),
    request("/engine/admin/logs", { signal }),
  ]);

  return {
    dashboard: dashboard.status === "fulfilled" ? dashboard.value : null,
    storage: storage.status === "fulfilled" ? storage.value : null,
    system: system.status === "fulfilled" ? system.value : null,
    config: config.status === "fulfilled" ? config.value : null,
    logs: logs.status === "fulfilled" ? logs.value : null,
    error: [dashboard, storage, system, config, logs].some((item) => item.status === "rejected"),
    updatedAt: new Date().toISOString(),
  };
}

export { POLLING_INTERVAL };
