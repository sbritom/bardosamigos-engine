export class AutoDJEngine {
  constructor(playlistEngine, logger, eventBus = null, nowPlaying = null, history = null) {
    this.playlistEngine = playlistEngine;
    this.logger = logger;
    this.eventBus = eventBus;
    this.nowPlaying = nowPlaying;
    this.history = history;
    this.blacklist = new Set();
    this.lastTrack = null;
    this.playedCycleKeys = new Set();
    this.selectionStrategyVersion = "cycle-aware-v2";
    this.active = false;
    this.syncUnsubscribe = null;
  }

  init() {
    this.active = true;
    this.bindSyncEvents();
    this.logger.info("autodj", "AutoDJ inicializado em modo logico.", {
      selectionStrategyVersion: this.selectionStrategyVersion,
    });
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
    this.syncCycleWithPlaylist();
  }

  selectNext({ consume = true, origin = "autodj" } = {}) {
    const beforeIndex = this.playlistEngine.index;
    const queued = this.playlistEngine.queueList()[0]?.track;
    const selected = queued || this.findNextPlaylistTrack();
    const selectionOrigin = queued ? "manual_queue" : origin;

    if (selected) {
      if (consume) this.commitSelection(selected, { origin: selectionOrigin, beforeIndex });
      else this.logSelection({
        beforeIndex,
        afterIndex: this.playlistEngine.index,
        selected,
        origin: selectionOrigin,
        consume,
      });
      this.eventBus?.emit("musicSelected", { track: selected });
    }

    return selected || null;
  }

  playNext() {
    const selected = this.selectNext({ consume: true });
    if (!selected) return null;
    this.nowPlaying?.start(selected);
    this.history?.add(selected);
    this.eventBus?.emit("musicStarted", { track: selected });
    return selected;
  }

  commitSelection(track, { origin = "autodj", beforeIndex = this.playlistEngine.index } = {}) {
    const committed = this.playlistEngine.commitTrack?.(track) || track;
    this.lastTrack = committed;
    this.markCyclePlayed(committed);
    this.logSelection({
      beforeIndex,
      afterIndex: this.playlistEngine.index,
      selected: committed,
      origin,
      consume: true,
    });
    return committed;
  }

  findNextPlaylistTrack() {
    const upcoming = this.playlistEngine.upcomingTracks?.() || [];
    if (upcoming.length === 0) return null;
    const cycleCandidates = this.getCycleCandidates(upcoming);
    if (cycleCandidates.length === 0) return null;

    const tiers = [
      (track) => this.canPlay(track, { avoidArtist: true, avoidGenre: true, avoidSameTrack: true }),
      (track) => this.canPlay(track, { avoidArtist: true, avoidGenre: false, avoidSameTrack: true }),
      (track) => this.canPlay(track, { avoidArtist: false, avoidGenre: true, avoidSameTrack: true }),
      (track) => this.canPlay(track, { avoidArtist: false, avoidGenre: false, avoidSameTrack: true }),
      (track) => this.canPlay(track, { avoidArtist: false, avoidGenre: false, avoidSameTrack: false }),
    ];

    for (const tier of tiers) {
      const selected = cycleCandidates.find((track) => tier(track));
      if (selected) return selected;
    }

    return cycleCandidates[0] || null;
  }

  canPlay(track, { avoidArtist = true, avoidGenre = true, avoidSameTrack = true } = {}) {
    if (!track) return false;
    if (this.blacklist.has(track.id)) return false;
    if (avoidSameTrack && this.lastTrack?.id === track.id) return false;
    if (avoidArtist && this.lastTrack?.artist && this.lastTrack.artist === track.artist) return false;
    if (avoidGenre && this.lastTrack?.genre && this.lastTrack.genre === track.genre) return false;
    return true;
  }

  addToBlacklist(trackId) {
    this.blacklist.add(trackId);
  }

  getCycleCandidates(upcoming) {
    const playable = upcoming.filter((track) => !this.blacklist.has(track.id));
    let candidates = playable.filter((track) => !this.playedCycleKeys.has(this.playlistEngine.trackKey(track)));

    if (candidates.length === 0 && playable.length > 0) {
      this.playedCycleKeys.clear();
      candidates = playable;
    }

    return candidates;
  }

  markCyclePlayed(track) {
    const key = this.playlistEngine.trackKey?.(track);
    if (key) this.playedCycleKeys.add(key);
  }

  syncCycleWithPlaylist() {
    const validKeys = new Set((this.playlistEngine.tracks || [])
      .map((track) => this.playlistEngine.trackKey(track))
      .filter(Boolean));
    this.playedCycleKeys = new Set([...this.playedCycleKeys].filter((key) => validKeys.has(key)));
  }

  logSelection({ beforeIndex, afterIndex, selected, origin, consume }) {
    const nextTrack = this.playlistEngine.peek?.();
    this.logger.info("autodj", "AutoDJ selection.", {
      playlistIndexBefore: beforeIndex,
      playlistIndexAfter: afterIndex,
      trackId: selected?.id || null,
      title: selected?.title || null,
      origin,
      consume,
      totalTracks: this.playlistEngine.tracks?.length || 0,
      selectionStrategyVersion: this.selectionStrategyVersion,
      lastTrack: this.lastTrack
        ? {
          id: this.lastTrack.id,
          title: this.lastTrack.title,
          artist: this.lastTrack.artist,
          genre: this.lastTrack.genre,
        }
        : null,
      nextPredicted: nextTrack
        ? {
          id: nextTrack.id,
          title: nextTrack.title,
          artist: nextTrack.artist,
          genre: nextTrack.genre,
        }
        : null,
      cyclePlayed: this.playedCycleKeys.size,
    });
  }
}
