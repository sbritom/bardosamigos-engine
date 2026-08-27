import { radioDataStore } from "./dataStore.js";

export const StatsService = {
  getStats() {
    return {
      mostPlayed: radioDataStore.tracks.slice(0, 3),
      topArtists: [...new Set(radioDataStore.tracks.map((track) => track.artist))],
      topCategories: [...new Set(radioDataStore.tracks.map((track) => track.category))],
      uploads: radioDataStore.tracks.length,
      downloads: 0,
      totalBroadcastHours: 128,
      audienceGrowth: 18,
      listeners: {
        online: radioDataStore.listeners.length,
        peak: 96,
      },
    };
  },
};
