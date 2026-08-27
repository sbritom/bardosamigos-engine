import { radioConfig } from "../config/radioConfig.js";
import { radioDataStore } from "./dataStore.js";

export const StreamingService = {
  getStatus() {
    return {
      online: Boolean(radioConfig.streamUrl),
      autoDj: radioConfig.autoDjEnabled,
      streaming: Boolean(radioConfig.streamUrl),
      currentTrackId: radioDataStore.tracks[0]?.id || null,
      nextTrackId: radioDataStore.tracks[1]?.id || null,
      remainingSeconds: 148,
      listenersOnline: radioDataStore.listeners.length,
      audiencePeak: 96,
      storageUsedGb: 4.8,
      storageTotalGb: 15,
      lastUploadAt: radioDataStore.tracks[0]?.uploadedAt || null,
      lastError: radioConfig.streamUrl ? "" : "Stream ainda nao configurado.",
      provider: radioConfig.provider,
    };
  },

  getProviderConfig() {
    return {
      provider: radioConfig.provider,
      streamUrl: radioConfig.streamUrl,
      statusUrl: radioConfig.statusUrl,
      supports: {
        icecast: true,
        shoutcast: true,
        external: true,
      },
      implemented: false,
      sprint: 3,
    };
  },
};
