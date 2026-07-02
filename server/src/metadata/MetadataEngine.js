import { readMetadata } from "../library/MetadataReader.js";

export class MetadataEngine {
  read(filePath) {
    return readMetadata(filePath);
  }

  normalize(track) {
    return {
      id: track?.id || null,
      title: track?.title || "",
      artist: track?.artist || "",
      album: track?.album || "",
      duration: Number(track?.duration || 0),
      bitrate: track?.bitrate || null,
      sampleRate: track?.sampleRate || null,
      cover: track?.cover || null,
    };
  }
}
