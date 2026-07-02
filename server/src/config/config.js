import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLibraryPath } from "../utils/resolveLibraryPath.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, "..", "..");

export function createRuntimeConfig(env = process.env) {
  const library = resolveLibraryPath(env);

  return {
    HOST: env.RADIO_HOST || "0.0.0.0",
    PORT: Number(env.RADIO_ENGINE_PORT || env.RADIO_SERVER_PORT || env.PORT || 3333),
    ICECAST_HOST: env.ICECAST_HOST || "localhost",
    ICECAST_PORT: Number(env.ICECAST_PORT || 8000),
    ICECAST_SOURCE_PASSWORD: env.ICECAST_SOURCE_PASSWORD || env.ICECAST_PASSWORD || "hackme",
    ICECAST_MOUNT: env.ICECAST_MOUNT || "/radio",
    BITRATE: env.AUDIO_BITRATE || "192k",
    SAMPLERATE: Number(env.AUDIO_SAMPLE_RATE || 44100),
    CHANNELS: Number(env.AUDIO_CHANNELS || 2),
    AUTO_DJ: env.AUTO_DJ_ENABLED !== "false",
    CROSSFADE: env.RADIO_CROSSFADE === "true",
    SHUFFLE: env.RADIO_SHUFFLE !== "false",
    LOG_LEVEL: env.LOG_LEVEL || "info",
    LIBRARY_PATH: library.path || path.resolve(process.cwd(), "music"),
    LIBRARY_FS_PATH: library.fsPath || library.path || path.resolve(process.cwd(), "music"),
    LIBRARY_FOUND: library.found,
    LIBRARY_CANDIDATES: library.candidates,
    LIBRARY_HAS_AUDIO: library.hasAudio,
    CACHE_PATH: path.resolve(serverRoot, env.RADIO_CACHE_FOLDER || "cache"),
    QUEUE_PATH: path.resolve(serverRoot, env.RADIO_QUEUE_FOLDER || "queue"),
  };
}

export const CONFIG = createRuntimeConfig();
