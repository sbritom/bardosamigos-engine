export class AudienceHistoryEngine {
  constructor({ storage, limit = 1000 }) {
    this.storage = storage;
    this.limit = limit;
    this.items = storage.read("history").items || [];
  }

  record(track) {
    if (!track?.id) return null;
    const item = {
      id: `${track.id}-${Date.now()}`,
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      duration: track.duration,
      playedAt: new Date().toISOString(),
    };
    this.items.unshift(item);
    this.items = this.items.slice(0, this.limit);
    this.storage.write("history", { items: this.items });
    return item;
  }

  list(limit = this.limit) {
    return {
      items: this.items.slice(0, limit),
      total: this.items.length,
    };
  }
}
