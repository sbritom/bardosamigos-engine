import { radioApi } from "../api";

export const ConfigService = {
  getConfig(options) {
    return radioApi.getConfig(options);
  },

  async saveConfig(config) {
    return {
      data: config,
      error: null,
      pendingBackendWrite: true,
    };
  },
};

export const configService = ConfigService;
