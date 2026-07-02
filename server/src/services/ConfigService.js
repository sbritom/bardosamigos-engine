import { radioDataStore } from "./dataStore.js";

export const ConfigService = {
  getConfig() {
    return radioDataStore.config;
  },
};
