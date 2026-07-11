import { ConfigEngine } from "./config/ConfigEngine.js";
import { AutoDJEngine } from "./autodj/AutoDJEngine.js";
import { EventBus } from "./events/EventBus.js";
import { QueueEngine } from "./queue/QueueEngine.js";
import { LibraryManager } from "./library/LibraryManager.js";
import { LibrarySyncService } from "./library/LibrarySyncService.js";
import { LoggerEngine } from "./logger/LoggerEngine.js";
import { PlaylistEngine } from "./library/PlaylistEngine.js";

const watchMode = process.argv.includes("--watch") || process.env.npm_config_watch === "true";

function printList(title, values) {
  console.info(`${title}:`);
  if (!values || values.length === 0) {
    console.info("nenhum");
    return;
  }
  values.forEach((value) => console.info(`- ${value}`));
}

const config = new ConfigEngine(process.env).load();
const logger = new LoggerEngine(config);
logger.init();

const eventBus = new EventBus();
const manager = new LibraryManager(config, logger, eventBus);
const playlist = new PlaylistEngine({ list: () => manager.getTracks() }, config);
const audioQueue = new QueueEngine();
const autodj = new AutoDJEngine(playlist, logger, eventBus);
const syncService = new LibrarySyncService({
  libraryManager: manager,
  playlistEngine: playlist,
  audioQueue,
  logger,
  eventBus,
});

playlist.init();
autodj.init();
syncService.init();

["library:ready", "track:added", "track:removed", "track:updated", "library:changed"].forEach((eventName) => {
  manager.on(eventName, (event) => {
    console.info("Evento:");
    console.info(eventName.toUpperCase().replace(":", "_"));
    if (event.payload?.track) {
      console.info("Nome:");
      console.info(event.payload.track.filename);
      console.info("ID:");
      console.info(event.payload.track.id);
    }
    console.info("Cache:");
    console.info("Atualizado");
  });
});

[
  ["playlist:reloaded", "PLAYLIST_RELOADED"],
  ["queue:updated", "QUEUE_UPDATED"],
  ["autodj:synchronized", "AUTODJ_SYNCHRONIZED"],
].forEach(([eventName, label]) => {
  eventBus.on(eventName, (event) => {
    console.info("Evento:");
    console.info(label);
    console.info("Playlist:");
    console.info(event.playlistSize ?? event.tracks ?? playlist.tracks.length);
    console.info("Queue:");
    console.info(event.queueSize ?? audioQueue.list().length);
  });
});

const summary = await manager.initialize();
const stats = manager.getStats();
const watcherStatus = manager.getWatcherStatus();

console.info("========== LIBRARY DEBUG ==========");
console.info("Library path:");
console.info(summary.libraryPath);
console.info("Tracks:");
console.info(stats.totalTracks);
console.info("Artists:");
console.info(stats.artistsCount);
console.info("Albums:");
console.info(stats.albumsCount);
console.info("Genres:");
console.info(stats.genresCount);
console.info("Extensions:");
Object.entries(stats.extensions).forEach(([extension, total]) => console.info(`${extension}: ${total}`));
console.info("Folders:");
stats.folders.forEach((folder) => console.info(`${folder}: ${manager.getTracks().filter((track) => track.sourceFolder === folder).length}`));
console.info("Cache:");
console.info(summary.cachePath);
console.info("Novos arquivos:");
console.info(summary.changes.added.length);
printList("Novos", summary.changes.added.map((track) => track.filename));
console.info("Arquivos removidos:");
console.info(summary.changes.removed.length);
printList("Removidos", summary.changes.removed.map((track) => track.filename));
console.info("Arquivos atualizados:");
console.info(summary.changes.updated.length);
printList("Atualizados", summary.changes.updated.map((track) => track.filename));
console.info("Status:");
console.info("OK");
console.info("Watcher:");
console.info(watcherStatus.online ? "ONLINE" : "OFFLINE");
console.info("Subpastas:");
console.info(watcherStatus.folders);
console.info("Arquivos:");
console.info(watcherStatus.files);
console.info("=================================");

if (watchMode) {
  console.info("Aguardando alteracoes...");
  process.on("SIGINT", () => {
    syncService.stop();
    manager.stop();
    console.info("Watcher finalizado.");
    process.exit(0);
  });
} else {
  syncService.stop();
  manager.stop();
}
