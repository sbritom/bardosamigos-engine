import { radioApi } from "../api";

export const LoggerService = {
  listLogs(options) {
    return radioApi.listLogs(options);
  },

  log(level, message, context = {}) {
    const entry = {
      id: `client-log-${Date.now()}`,
      type: "client",
      level,
      message,
      context,
      createdAt: new Date().toISOString(),
    };

    if (level === "error") {
      console.error("[Bar Radio Engine]", entry);
    } else {
      console.info("[Bar Radio Engine]", entry);
    }

    return entry;
  },
};
