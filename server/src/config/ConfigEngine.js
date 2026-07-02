import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { createRuntimeConfig } from "./config.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, "..", "..");
const projectRoot = path.resolve(serverRoot, "..");

function readJsonConfig(fileName, fallback) {
  const filePath = path.join(projectRoot, "config", fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return { ...fallback, ...JSON.parse(fs.readFileSync(filePath, "utf8")) };
}

function resolveDryRun(env, stream) {
  if (env.RADIO_USE_MOCKS === "false") return false;
  if (env.RADIO_USE_MOCKS === "true") return true;
  if (env.STREAM_DRY_RUN) return env.STREAM_DRY_RUN === "true";
  return stream.dryRun === true;
}

export class ConfigEngine {
  constructor(env = process.env) {
    this.env = env;
    this.config = null;
  }

  load() {
    const runtime = createRuntimeConfig(this.env);
    const stream = readJsonConfig("stream.json", {});
    const icecast = readJsonConfig("icecast.json", {});
    const audio = readJsonConfig("audio.json", {});
    const ffmpeg = readJsonConfig("ffmpeg.json", {});

    this.config = {
      radioName: this.env.RADIO_NAME || "Radio Bar dos Amigos",
      radioSlogan: this.env.RADIO_SLOGAN || "A trilha sonora da nossa amizade",
      host: runtime.HOST,
      musicFolder: runtime.LIBRARY_FS_PATH,
      libraryPath: runtime.LIBRARY_PATH,
      libraryPathFound: runtime.LIBRARY_FOUND || fs.existsSync(runtime.LIBRARY_FS_PATH),
      libraryHasAudio: runtime.LIBRARY_HAS_AUDIO,
      libraryPathCandidates: runtime.LIBRARY_CANDIDATES,
      playlistFolder: path.resolve(serverRoot, this.env.RADIO_PLAYLIST_FOLDER || "playlists"),
      logFolder: path.resolve(serverRoot, this.env.RADIO_LOG_FOLDER || "logs"),
      cacheFolder: runtime.CACHE_PATH,
      queueFolder: runtime.QUEUE_PATH,
      historyLimit: Number(this.env.RADIO_HISTORY_LIMIT || 100),
      crossfade: runtime.CROSSFADE,
      fadeIn: this.env.RADIO_FADE_IN !== "false",
      fadeOut: this.env.RADIO_FADE_OUT !== "false",
      shuffle: runtime.SHUFFLE,
      autoDJ: runtime.AUTO_DJ,
      logLevel: runtime.LOG_LEVEL,
      apiPort: runtime.PORT,
      stream: {
        ...stream,
        ...icecast,
        host: this.env.ICECAST_HOST || icecast.host || stream.host || runtime.ICECAST_HOST,
        port: Number(this.env.ICECAST_PORT || icecast.port || stream.port || runtime.ICECAST_PORT),
        mount: this.env.ICECAST_MOUNT || icecast.mount || stream.mount || runtime.ICECAST_MOUNT,
        username: this.env.ICECAST_USER || icecast.username || stream.username || "source",
        password: this.env.ICECAST_SOURCE_PASSWORD || this.env.ICECAST_PASSWORD || icecast.password || stream.password || runtime.ICECAST_SOURCE_PASSWORD,
        adminUser: this.env.ICECAST_ADMIN_USER || icecast.adminUser || "admin",
        adminPassword: this.env.ICECAST_ADMIN_PASSWORD || icecast.adminPassword || "admin",
        dryRun: resolveDryRun(this.env, stream),
      },
      audio: {
        sampleRate: Number(this.env.AUDIO_SAMPLE_RATE || audio.sampleRate || runtime.SAMPLERATE),
        channels: Number(this.env.AUDIO_CHANNELS || audio.channels || runtime.CHANNELS),
        bitrate: this.env.AUDIO_BITRATE || audio.bitrate || runtime.BITRATE,
        codec: this.env.AUDIO_CODEC || audio.codec || "libmp3lame",
        format: this.env.AUDIO_FORMAT || audio.format || "mp3",
        contentType: audio.contentType || "audio/mpeg",
      },
      ffmpeg: {
        ...ffmpeg,
        executablePath: this.env.FFMPEG_PATH || ffmpeg.executablePath || "",
      },
      streamOnStart: this.env.RADIO_STREAM_ON_START === "true",
    };

    return this.config;
  }

  get() {
    return this.config || this.load();
  }
}
