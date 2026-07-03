export class AudioQueue {
  constructor() {
    this.items = [];
    this.preloaded = null;
    this.played = [];
  }

  add(track, priority = 0) {
    return this.enqueue(track, priority);
  }

  enqueue(track, priority = 0) {
    const item = {
      id: `audio-queue-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      track,
      priority,
      addedAt: new Date().toISOString(),
    };
    this.items.push(item);
    this.items.sort((a, b) => b.priority - a.priority);
    return item;
  }

  next() {
    const queued = this.items.shift()?.track;
    if (queued) {
      this.played.unshift(queued);
      return queued;
    }
    const preloaded = this.preloaded;
    this.preloaded = null;
    if (preloaded) this.played.unshift(preloaded);
    return preloaded || null;
  }

  previous() {
    return this.played[1] || this.played[0] || null;
  }

  peek() {
    return this.items[0]?.track || this.preloaded;
  }

  shuffle() {
    this.items = this.items
      .map((item) => ({ item, weight: Math.random() }))
      .sort((a, b) => a.weight - b.weight)
      .map(({ item }) => item);
    return this.items;
  }

  dequeue(queueId = null) {
    if (!queueId) return this.items.shift()?.track || null;
    const index = this.items.findIndex((item) => item.id === queueId);
    if (index < 0) return null;
    return this.items.splice(index, 1)[0]?.track || null;
  }

  preload(track) {
    this.preloaded = track;
    return track;
  }

  clear() {
    this.items = [];
    this.preloaded = null;
    this.played = [];
  }

  list() {
    return this.items;
  }

  syncWithTracks(tracks = [], { currentTrack = null } = {}) {
    const trackKey = (track) => track?.id || track?.path || track?.filename || null;
    const tracksByKey = new Map(tracks.map((track) => [trackKey(track), track]).filter(([key]) => key));
    const previousItems = this.items.length;
    const previousPreloaded = Boolean(this.preloaded);

    this.items = this.items
      .map((item) => {
        const key = trackKey(item.track);
        const track = tracksByKey.get(key);
        return track ? { ...item, track } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.priority - a.priority);

    if (this.preloaded) {
      const preloadedKey = trackKey(this.preloaded);
      this.preloaded = tracksByKey.get(preloadedKey) || null;
    }

    this.played = this.played
      .map((track) => tracksByKey.get(trackKey(track)) || track)
      .filter((track) => trackKey(track) === trackKey(currentTrack) || tracksByKey.has(trackKey(track)));

    return {
      queueSize: this.items.length,
      removedQueueItems: previousItems - this.items.length,
      preloadedPreserved: previousPreloaded && Boolean(this.preloaded),
      currentTrackPreserved: Boolean(currentTrack),
    };
  }
}
