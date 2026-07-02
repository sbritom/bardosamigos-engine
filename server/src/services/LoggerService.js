import { radioDataStore } from "./dataStore.js";

export const LoggerService = {
  log(type, level, message, context = {}) {
    const entry = {
      id: `log-${Date.now()}`,
      type,
      level,
      message,
      context,
      createdAt: new Date().toISOString(),
    };

    radioDataStore.logs.unshift(entry);
    return entry;
  },

  listLogs() {
    return radioDataStore.logs;
  },
};
