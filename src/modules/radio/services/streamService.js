import { radioApi } from "../api";

export const StreamingService = {
  getStatus(options) {
    return radioApi.getStatus(options);
  },

  getStream(options) {
    return radioApi.getStream(options);
  },

  getAudio(options) {
    return radioApi.getAudio(options);
  },

  getIcecast(options) {
    return radioApi.getIcecast(options);
  },

  async testConnection(config = {}) {
    return {
      data: {
        online: Boolean(config.streamUrl),
        message: config.streamUrl ? "Stream configurado para teste." : "Stream ainda nao configurado.",
        provider: config.streamingType || "external",
      },
      error: null,
    };
  },
};

export const streamService = StreamingService;
export const streamingService = StreamingService;
