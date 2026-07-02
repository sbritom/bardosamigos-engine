import { radioDataStore } from "./dataStore.js";

export const ListenerService = {
  listListeners() {
    return radioDataStore.listeners;
  },

  getSummary() {
    return {
      online: radioDataStore.listeners.length,
      peak: 96,
      today: 342,
      yesterday: 298,
    };
  },
};
