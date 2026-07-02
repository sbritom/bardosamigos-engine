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
    if (this.queueItems.length > 0) {
      const queued = this.queueItems.shift().track;
      this.played.unshift(queued);
      return queued;
    }
    if (this.tracks.length === 0) return null;
    if (!this.repeatEnabled && this.index + 1 >= this.tracks.length) return null;
    this.index = (this.index + 1) % this.tracks.length;
    const track = this.tracks[this.index];
    this.played.unshift(track);
    return track;
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
    this.tracks = this.libraryEngine.list();
    if (this.config.shuffle) this.shuffle();
    this.index = -1;
    this.played = [];
    this.queueItems = [];
    return this.tracks;
  }
}
