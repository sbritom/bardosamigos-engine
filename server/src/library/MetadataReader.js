import path from "node:path";

import { MediaMetadataEngine } from "../metadata/MediaMetadataEngine.js";

const audioExtensions = new Set([".mp3", ".aac", ".ogg", ".wav", ".flac", ".m4a"]);
const sharedMetadataEngine = new MediaMetadataEngine();

export function isSupportedAudio(filePath) {
  return audioExtensions.has(path.extname(filePath).toLowerCase());
}

export async function readMetadata(filePath, rootFolder = path.dirname(filePath)) {
  return sharedMetadataEngine.read(filePath, rootFolder);
}
