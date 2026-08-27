export class FavoritesEngine {
  constructor({ config, storage, eventBus, logger }) {
    this.config = config;
    this.storage = storage;
    this.eventBus = eventBus;
    this.logger = logger;
    this.data = storage.read("favorites");
  }

  addTrack(track) {
    if (!this.config.favoritesEnabled || !track) return this.get();
    this.increment("tracks", track.id, track);
    this.increment("artists", track.artist, { name: track.artist });
    this.increment("albums", track.album, { name: track.album, artist: track.artist });
    this.increment("genres", track.genre, { name: track.genre });
    this.persist();
    this.eventBus?.emit("favorites:updated", this.get());
    return this.get();
  }

  increment(type, key, payload) {
    if (!key) return;
    const current = this.data[type][key] || { ...payload, count: 0, updatedAt: null };
    this.data[type][key] = {
      ...current,
      ...payload,
      count: Number(current.count || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  get() {
    return this.data;
  }

  persist() {
    this.storage.write("favorites", this.data);
    this.logger?.info("audience", "Favorites updated.");
  }
}
