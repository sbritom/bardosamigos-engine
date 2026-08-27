export function getCurrentTrack(state) {
  return state.tracks.find((track) => track.id === state.status.currentTrackId) || state.tracks[0] || null;
}

export function getNextTrack(state) {
  return state.tracks.find((track) => track.id === state.status.nextTrackId) || state.tracks[1] || null;
}

export function getPlaylistDuration(playlist, tracks) {
  return playlist.trackIds.reduce((total, trackId) => {
    const track = tracks.find((item) => item.id === trackId);
    return total + (track?.duration || 0);
  }, 0);
}

export function filterTracks(tracks, { query = "", category = "all", view = "grid" } = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  return tracks
    .filter((track) => category === "all" || track.category === category)
    .filter((track) => {
      if (!normalizedQuery) return true;
      return [track.title, track.artist, track.album, track.category].some((field) =>
        String(field).toLowerCase().includes(normalizedQuery),
      );
    })
    .map((track) => ({ ...track, view }));
}
