export class AutoDJEngine {
  constructor(playlistEngine, logger, eventBus = null, nowPlaying = null, history = null) {
    this.playlistEngine = playlistEngine;
    this.logger = logger;
    this.eventBus = eventBus;
    this.nowPlaying = nowPlaying;
    this.history = history;
    this.blacklist = new Set();
    this.lastTrack = null;
    this.active = false;
    this.syncUnsubscribe = null;
  }

  init() {
    this.active = true;
    this.bindSyncEvents();
    this.logger.info("autodj", "AutoDJ inicializado em modo logico.");
  }

  bindSyncEvents() {
    if (!this.eventBus || this.syncUnsubscribe) return;
    this.syncUnsubscribe = this.eventBus.on("queue:updated", (payload) => this.synchronize(payload));
  }

  synchronize(payload = {}) {
    this.logger.info("autodj", "AutoDJ synchronized.", {
      playlistSize: payload.playlistSize,
      queueSize: payload.queueSize,
      currentTrackPreserved: payload.currentTrackPreserved,
    });
    this.eventBus?.emit("autodj:synchronized", {
      playlistSize: payload.playlistSize,
      queueSize: payload.queueSize,
      synchronizedAt: new Date().toISOString(),
    });
  }

  selectNext() {
    const queued = this.playlistEngine.queueList()[0]?.track;
    const candidates = queued ? [queued] : this.playlistEngine.tracks.filter((track) => this.canPlay(track));
    const selected = candidates[0] || this.playlistEngine.peek();

    if (selected) {
      this.lastTrack = selected;
      this.eventBus?.emit("musicSelected", { track: selected });
    }

    return selected || null;
  }

  playNext() {
    const selected = this.selectNext();
    if (!selected) return null;
    this.nowPlaying?.start(selected);
    this.history?.add(selected);
    this.eventBus?.emit("musicStarted", { track: selected });
    return selected;
  }

  canPlay(track) {
    if (!track) return false;
    if (this.blacklist.has(track.id)) return false;
    if (this.lastTrack?.id === track.id) return false;
    if (this.lastTrack?.artist && this.lastTrack.artist === track.artist) return false;
    if (this.lastTrack?.genre && this.lastTrack.genre === track.genre) return false;
    return true;
  }

  addToBlacklist(trackId) {
    this.blacklist.add(trackId);
  }
}
