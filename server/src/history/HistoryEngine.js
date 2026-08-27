export class HistoryEngine {
  constructor(limit = 100, logger = null, eventBus = null) {
    this.limit = limit;
    this.logger = logger;
    this.eventBus = eventBus;
    this.items = [];
  }

  init(eventBus) {
    eventBus.on("musicStarted", ({ track }) => this.add(track));
  }

  add(track) {
    if (!track) return null;
    const item = {
      ...track,
      playedAt: new Date().toISOString(),
    };
    this.items.unshift(item);
    this.items = this.items.slice(0, this.limit);
    this.logger?.info("history", "Historico atualizado.", { trackId: track.id });
    this.eventBus?.emit("historyUpdated", { item, total: this.items.length });
    return item;
  }

  list() {
    return this.items;
  }

  last() {
    return this.items[0] || null;
  }

  previous() {
    return this.items[1] || null;
  }

  search(query) {
    const normalized = String(query || "").toLowerCase();
    return this.items.filter((item) =>
      [item.title, item.artist, item.album, item.category].some((value) =>
        String(value || "").toLowerCase().includes(normalized),
      ),
    );
  }

  clear() {
    this.items = [];
  }
}
