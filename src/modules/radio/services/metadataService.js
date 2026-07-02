import { radioApi } from "../api";
import { normalizeTrackMetadata, parseTrackTitle } from "../utils";

export const MetadataService = {
  parse(rawMetadata = {}) {
    if (typeof rawMetadata === "string") {
      return parseTrackTitle(rawMetadata);
    }

    return normalizeTrackMetadata(rawMetadata);
  },

  getNowPlaying(options) {
    return radioApi.getNowPlaying(options);
  },

  getHistory(options) {
    return radioApi.getHistory(options);
  },
};

export const metadataService = MetadataService;
export const nowPlayingService = MetadataService;
