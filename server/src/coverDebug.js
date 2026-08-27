import { ConfigEngine } from "./config/ConfigEngine.js";
import { LibraryManager } from "./library/LibraryManager.js";
import { LoggerEngine } from "./logger/LoggerEngine.js";

const config = new ConfigEngine(process.env).load();
const logger = new LoggerEngine(config);
logger.init();

const manager = new LibraryManager(config, logger);
await manager.initialize();

const tracks = manager.getTracks();
const coverEngine = manager.metadataEngine.coverEngine;
const stats = coverEngine.stats(tracks);

console.info("========== COVER DEBUG ==========");
console.info("Musicas:");
console.info(tracks.length);
console.info("Capas extraidas:");
console.info(stats.coversExtracted);
console.info("Capas em cache:");
console.info(stats.coversCached);
console.info("Capas ausentes:");
console.info(stats.coversMissing);
console.info("Storage usado:");
console.info(stats.storageUsed);
console.info("---------------------------------");

tracks.forEach((track) => {
  const cover = coverEngine.resolve(track);
  const cached = coverEngine.cache.get(track.hash);

  console.info("Arquivo:");
  console.info(track.filename);
  console.info("Titulo:");
  console.info(track.title);
  console.info("Cover encontrada:");
  console.info(track.coverAvailable ? "Sim" : "Nao");
  console.info("Formato:");
  console.info(track.coverMimeType || cover.mimeType || "N/A");
  console.info("Dimensoes:");
  console.info(cached?.dimensions ? `${cached.dimensions.width || "?"}x${cached.dimensions.height || "?"}` : "N/A");
  console.info("Cache:");
  console.info(cached ? "OK" : "N/A");
  console.info("Miniaturas:");
  console.info([512, 256, 128, 64].map((size) => `${size}:${cached?.thumbnails?.[size] ? "OK" : "N/A"}`).join(" "));
  console.info("Status:");
  console.info("OK");
  console.info("---------------------------------");
});

console.info("=================================");
manager.stop();
