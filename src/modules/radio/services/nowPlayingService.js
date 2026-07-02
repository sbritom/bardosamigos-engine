import { radioApiConfig } from "../config";
import { MetadataService } from "./metadataService";

export const NowPlayingService = {
  getNowPlaying(options) {
    return MetadataService.getNowPlaying(options);
  },

  subscribe(callback, intervalMs = radioApiConfig.pollingInterval) {
    let active = true;

    async function tick() {
      const result = await NowPlayingService.getNowPlaying();
      if (active) {
        callback(result);
      }
    }

    tick();
    const timer = window.setInterval(tick, intervalMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  },
};
