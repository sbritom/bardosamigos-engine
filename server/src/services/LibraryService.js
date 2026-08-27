import { radioDataStore } from "./dataStore.js";

export const LibraryService = {
  listTracks(filters = {}) {
    const query = String(filters.query || "").toLowerCase();
    const category = filters.category || "all";

    return radioDataStore.tracks.filter((track) => {
      const matchesCategory = category === "all" || track.category === category;
      const matchesQuery =
        !query ||
        [track.title, track.artist, track.album, track.category].some((field) =>
          String(field).toLowerCase().includes(query),
        );

      return matchesCategory && matchesQuery;
    });
  },

  listCategories() {
    return radioDataStore.categories;
  },
};
