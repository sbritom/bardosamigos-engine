import { radioDataStore } from "./dataStore.js";

function getDuration(trackIds) {
  return trackIds.reduce((total, trackId) => {
    const track = radioDataStore.tracks.find((item) => item.id === trackId);
    return total + (track?.duration || 0);
  }, 0);
}

export const PlaylistService = {
  listPlaylists() {
    return radioDataStore.playlists.map((playlist) => ({
      ...playlist,
      totalTracks: playlist.trackIds.length,
      totalDuration: getDuration(playlist.trackIds),
    }));
  },
};
