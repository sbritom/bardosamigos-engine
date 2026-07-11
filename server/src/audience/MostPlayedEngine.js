export class MostPlayedEngine {
  constructor({ storage, limit = 100 }) {
    this.storage = storage;
    this.limit = limit;
    this.items = storage.read("most-played").tracks || [];
  }

  record(track) {
    if (!track?.id) return this.list();
    const current = this.items.find((item) => item.id === track.id);
    if (current) {
      current.count += 1;
      current.lastPlayedAt = new Date().toISOString();
    } else {
      this.items.push({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        genre: track.genre,
        duration: track.duration,
        count: 1,
        lastPlayedAt: new Date().toISOString(),
      });
    }
    this.items.sort((a, b) => b.count - a.count);
    this.items = this.items.slice(0, this.limit);
    this.storage.write("most-played", { tracks: this.items });
    return this.list();
  }

  list(limit = this.limit) {
    return {
      top10: this.items.slice(0, 10),
      top50: this.items.slice(0, 50),
      top100: this.items.slice(0, 100),
      tracks: this.items.slice(0, limit),
    };
  }
}
