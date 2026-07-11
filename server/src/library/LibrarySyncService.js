export class LibrarySyncService {
  constructor({
    libraryManager,
    libraryEngine = null,
    playlistEngine,
    audioQueue = null,
    logger = null,
    eventBus = null,
    getCurrentTrack = () => null,
  } = {}) {
    this.libraryManager = libraryManager;
    this.libraryEngine = libraryEngine;
    this.playlistEngine = playlistEngine;
    this.audioQueue = audioQueue;
    this.logger = logger;
    this.eventBus = eventBus;
    this.getCurrentTrack = getCurrentTrack;
    this.unsubscribe = null;
  }

  init() {
    if (!this.eventBus || !this.playlistEngine) return;
    this.unsubscribe = this.eventBus.on("library:changed", (event) => this.synchronize(event));
  }

  synchronize(event = {}) {
    this.logger?.info("library", "Library changed.", {
      changes: event.payload?.changes || event.changes || null,
    });

    const tracks = this.refreshTracks();
    const currentTrack = this.getCurrentTrack();
    const playlistResult = this.playlistEngine.reload(tracks, { currentTrack });

    this.logger?.info("playlist", "Playlist reloaded.", playlistResult);
    this.eventBus?.emit("playlist:reloaded", {
      ...playlistResult,
      currentTrack,
      sourceEvent: event,
    });

    const queueResult = this.audioQueue?.syncWithTracks?.(this.playlistEngine.tracks, { currentTrack }) || {
      queueSize: 0,
      removedQueueItems: 0,
      currentTrackPreserved: Boolean(currentTrack),
    };

    this.logger?.info("playlist", "Queue updated.", queueResult);
    this.eventBus?.emit("queue:updated", {
      ...queueResult,
      currentTrack,
      playlistSize: this.playlistEngine.tracks.length,
      sourceEvent: event,
    });

    return {
      playlist: playlistResult,
      queue: queueResult,
    };
  }

  refreshTracks() {
    return this.libraryManager?.getTracks?.() || this.libraryEngine?.list?.() || [];
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
