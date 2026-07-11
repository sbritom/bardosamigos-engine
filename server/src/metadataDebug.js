import { ConfigEngine } from "./config/ConfigEngine.js";
import { LibraryManager } from "./library/LibraryManager.js";
import { LoggerEngine } from "./logger/LoggerEngine.js";

const config = new ConfigEngine(process.env).load();
const logger = new LoggerEngine(config);
logger.init();

const manager = new LibraryManager(config, logger);
const startedAt = Date.now();
const summary = await manager.initialize();
const tracks = manager.getTracks();
const metadataStats = manager.metadataEngine.getStats(tracks);
const cache = manager.metadataEngine.getCacheInfo();

console.info("========== METADATA DEBUG ==========");
console.info("Biblioteca:");
console.info(summary.libraryPath);
console.info("Musicas processadas:");
console.info(tracks.length);
console.info("Cache:");
console.info(cache.cachePath);
console.info("Capas extraidas:");
console.info(metadataStats.coversExtracted);
console.info("Performance media:");
console.info(`${metadataStats.averageReadMs} ms`);
console.info("──────────────────────────");

tracks.forEach((track) => {
  console.info("Título");
  console.info(track.title);
  console.info("Artista:");
  console.info(track.artist);
  console.info("Album:");
  console.info(track.album);
  console.info("Genero:");
  console.info(track.genre);
  console.info("Ano:");
  console.info(track.year ?? "N/A");
  console.info("Duração:");
  console.info(track.durationFormatted || "N/A");
  console.info("Bitrate:");
  console.info(track.bitrate ? `${track.bitrate} kbps` : "N/A");
  console.info("Codec:");
  console.info(track.codec || "N/A");
  console.info("Sample Rate:");
  console.info(track.sampleRate || "N/A");
  console.info("Hash:");
  console.info(track.hash || "N/A");
  console.info("Cover:");
  console.info(track.coverPath || track.cover || "N/A");
  console.info("Status:");
  console.info("OK");
  console.info("──────────────────────────");
});

console.info("Estatisticas:");
console.info(JSON.stringify({
  artists: metadataStats.artists,
  albums: metadataStats.albums,
  genres: metadataStats.genres,
  averageBitrate: metadataStats.averageBitrate,
  totalDuration: metadataStats.totalDuration,
  topCodec: metadataStats.topCodec,
  cacheHits: metadataStats.cacheHits,
  cacheMisses: metadataStats.cacheMisses,
  elapsedMs: Date.now() - startedAt,
}, null, 2));
console.info("====================================");

manager.stop();
