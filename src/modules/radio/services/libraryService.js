import { radioApi } from "../api";
import { filterTracks } from "../utils/radioSelectors";

export const LibraryService = {
  async searchTracks(filters = {}) {
    const result = await radioApi.listTracks(filters);
    return {
      ...result,
      data: filterTracks(result.data || [], filters),
    };
  },

  async getTrackById(trackId) {
    const result = await radioApi.listTracks();
    return {
      data: (result.data || []).find((track) => track.id === trackId) || null,
      error: result.error,
      fallback: result.fallback,
    };
  },
};

export const libraryService = LibraryService;
