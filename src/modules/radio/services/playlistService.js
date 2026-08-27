import { radioApi } from "../api";

export const PlaylistService = {
  listPlaylists(options) {
    return radioApi.listPlaylists(options);
  },
};

export const playlistService = PlaylistService;
