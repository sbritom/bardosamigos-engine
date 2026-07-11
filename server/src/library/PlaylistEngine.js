export class PlaylistEngine {
  constructor(libraryEngine, config) {
    this.libraryEngine = libraryEngine;
    this.config = config;
    this.tracks = [];
    this.index = -1;
    this.played = [];
    this.queueItems = [];
    this.repeatEnabled = false;
  }

  init() {
    this.reset();
  }

  trackKey(track) {
    return track?.id || track?.path || track?.filename || null;
  }

  sameTrack(a, b) {
    const aKey = this.trackKey(a);
    const bKey = this.trackKey(b);
    return Boolean(aKey && bKey && aKey === bKey);
  }

  shuffle() {
    this.tracks = this.smartShuffle(this.tracks);
    this.index = -1;
    return this.tracks;
  }

  smartShuffle(tracks) {
    const remaining = [...tracks];
    const shuffled = [];

    while (remaining.length > 0) {
      const last = shuffled.at(-1);
      const bestIndex = remaining.findIndex((track) =>
        track.id !== last?.id &&
        track.artist !== last?.artist &&
        track.album !== last?.album &&
        track.category !== last?.category
      );
      const index = bestIndex >= 0 ? bestIndex : 0;
      shuffled.push(remaining.splice(index, 1)[0]);
    }

    return shuffled;
  }

  next() {
    const queued = this.consumeQueuedTrack();
    if (queued) return queued;
    if (this.tracks.length === 0) return null;
    if (!this.repeatEnabled && this.index + 1 >= this.tracks.length) return null;
    this.index = (this.index + 1) % this.tracks.length;
    const track = this.tracks[this.index];
    this.played.unshift(track);
    return track;
  }

  consumeQueuedTrack(track = null) {
    if (this.queueItems.length === 0) return null;
    const index = track
      ? this.queueItems.findIndex((item) => this.sameTrack(item.track, track))
      : 0;
    if (index < 0) return null;
    const queued = this.queueItems.splice(index, 1)[0]?.track || null;
    if (queued) this.played.unshift(queued);
    return queued;
  }

  commitTrack(track) {
    if (!track) return null;
    const queued = this.consumeQueuedTrack(track);
    if (queued) return queued;

    const trackIndex = this.tracks.findIndex((item) => this.sameTrack(item, track));
    if (trackIndex >= 0) {
      this.index = trackIndex;
      this.played.unshift(this.tracks[trackIndex]);
      return this.tracks[trackIndex];
    }

    return null;
  }

  previous() {
    if (this.tracks.length === 0) return null;
    this.index = Math.max(this.index - 1, 0);
    return this.tracks[this.index];
  }

  queue(track) {
    return this.addToQueue(track);
  }

  addToQueue(track, priority = 0) {
    const item = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      track,
      priority,
      addedAt: new Date().toISOString(),
    };
    this.queueItems.push(item);
    this.queueItems.sort((a, b) => b.priority - a.priority);
    return item;
  }

  removeFromQueue(queueId) {
    this.queueItems = this.queueItems.filter((item) => item.id !== queueId);
  }

  moveQueueItem(queueId, nextIndex) {
    const currentIndex = this.queueItems.findIndex((item) => item.id === queueId);
    if (currentIndex < 0) return null;
    const [item] = this.queueItems.splice(currentIndex, 1);
    this.queueItems.splice(Math.max(0, nextIndex), 0, item);
    return item;
  }

  queueList() {
    return this.queueItems;
  }

  upcomingTracks() {
    if (this.tracks.length === 0) return [];
    const start = this.index + 1;
    return Array.from({ length: this.tracks.length }, (_, offset) => {
      const index = (start + offset) % this.tracks.length;
      return this.tracks[index];
    });
  }

  repeat(enabled = true) {
    this.repeatEnabled = enabled;
  }

  clear() {
    this.queueItems = [];
    this.played = [];
    this.index = -1;
  }

  peek() {
    if (this.tracks.length === 0) return null;
    return this.tracks[(this.index + 1) % this.tracks.length];
  }

  history() {
    return this.played;
  }

  reset() {
    this.tracks = this.getLibraryTracks();
    if (this.config.shuffle) this.shuffle();
    this.index = -1;
    this.played = [];
    this.queueItems = [];
    return this.tracks;
  }

  reload(tracks = this.getLibraryTracks(), { currentTrack = null } = {}) {
    const currentKey = this.trackKey(currentTrack) || this.trackKey(this.tracks[this.index]);
    const nextTracks = Array.isArray(tracks) ? [...tracks] : [];
    const tracksByKey = new Map(nextTracks.map((track) => [this.trackKey(track), track]).filter(([key]) => key));
    const previousQueueSize = this.queueItems.length;

    this.tracks = this.config.shuffle ? this.smartShuffle(nextTracks) : nextTracks;
    this.queueItems = this.queueItems
      .map((item) => {
        const key = this.trackKey(item.track);
        const track = tracksByKey.get(key);
        return track ? { ...item, track } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.priority - a.priority);
    this.played = this.played
      .map((track) => tracksByKey.get(this.trackKey(track)) || track)
      .filter((track) => currentKey === this.trackKey(track) || tracksByKey.has(this.trackKey(track)));
    this.index = currentKey
      ? this.tracks.findIndex((track) => this.trackKey(track) === currentKey)
      : -1;

    return {
      tracks: this.tracks.length,
      queueSize: this.queueItems.length,
      removedQueueItems: previousQueueSize - this.queueItems.length,
      currentTrackPreserved: Boolean(currentKey),
    };
  }

  getLibraryTracks() {
    if (this.libraryEngine?.getTracks) return this.libraryEngine.getTracks();
    if (this.libraryEngine?.list) return this.libraryEngine.list();
    return [];
  }
}
