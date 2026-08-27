export class AudienceStatistics {
  constructor({ storage, statisticsLimit = 100, eventBus, logger }) {
    this.storage = storage;
    this.statisticsLimit = statisticsLimit;
    this.eventBus = eventBus;
    this.logger = logger;
    this.data = storage.read("statistics");
  }

  recordTrack(track) {
    if (!track?.id) return this.get();
    this.data.totals.totalPlays = Number(this.data.totals.totalPlays || 0) + 1;
    this.data.totals.totalDuration = Number(this.data.totals.totalDuration || 0) + Number(track.duration || 0);
    this.data.totals.averageDuration = this.data.totals.totalPlays
      ? Math.round(this.data.totals.totalDuration / this.data.totals.totalPlays)
      : 0;
    this.increment("tracks", track.id, track);
    this.increment("artists", track.artist, { name: track.artist });
    this.increment("albums", track.album, { name: track.album, artist: track.artist });
    this.increment("genres", track.genre, { name: track.genre });
    this.persist();
    return this.get();
  }

  updateAudience(listeners = 0) {
    const current = Number(listeners || 0);
    const today = new Date().toISOString().slice(0, 10);
    const week = this.weekKey();
    const audience = this.data.audience || {};
    audience.current = current;
    audience.peakDay = Math.max(Number(audience.peakDay || 0), current);
    audience.peakWeek = Math.max(Number(audience.peakWeek || 0), current);
    audience.peakAll = Math.max(Number(audience.peakAll || 0), current);
    audience.day = today;
    audience.week = week;
    audience.updatedAt = new Date().toISOString();
    this.data.audience = audience;
    this.persist();
    this.eventBus?.emit("audience:updated", audience);
    return audience;
  }

  increment(type, key, payload) {
    if (!key) return;
    const bucket = this.data[type] || {};
    const current = bucket[key] || { ...payload, count: 0 };
    bucket[key] = {
      ...current,
      ...payload,
      count: Number(current.count || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    this.data[type] = bucket;
  }

  get() {
    return {
      totals: {
        totalPlays: Number(this.data.totals.totalPlays || 0),
        uniqueTracks: Object.keys(this.data.tracks || {}).length,
        artists: Object.keys(this.data.artists || {}).length,
        albums: Object.keys(this.data.albums || {}).length,
        genres: Object.keys(this.data.genres || {}).length,
        totalDuration: Number(this.data.totals.totalDuration || 0),
        averageDuration: Number(this.data.totals.averageDuration || 0),
      },
      audience: this.data.audience || {},
      updatedAt: this.data.updatedAt || null,
    };
  }

  persist() {
    this.data.updatedAt = new Date().toISOString();
    this.storage.write("statistics", this.data);
    this.logger?.info("statistics", "Statistics updated.");
    this.eventBus?.emit("statistics:updated", this.get());
  }

  weekKey(date = new Date()) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - firstDay) / 86400000);
    return `${date.getFullYear()}-W${Math.ceil((days + firstDay.getDay() + 1) / 7)}`;
  }
}
