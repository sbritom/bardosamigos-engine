import { radioDataStore } from "./dataStore.js";
import { StreamingService } from "./StreamingService.js";

export const NowPlayingService = {
  getNowPlaying() {
    const status = StreamingService.getStatus();
    const current = radioDataStore.tracks.find((track) => track.id === status.currentTrackId) || radioDataStore.tracks[0] || null;
    const next = radioDataStore.tracks.find((track) => track.id === status.nextTrackId) || radioDataStore.tracks[1] || null;

    return {
      current,
      next,
      history: NowPlayingService.getHistory(),
      remainingSeconds: status.remainingSeconds,
      updatedAt: new Date().toISOString(),
    };
  },

  getHistory() {
    return radioDataStore.tracks.slice(1, 6);
  },
};
