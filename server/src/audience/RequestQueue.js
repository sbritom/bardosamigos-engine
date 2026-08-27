export class RequestQueue {
  constructor(storage) {
    this.storage = storage;
    this.items = [];
  }

  init() {
    this.items = this.storage.read("requests").items || [];
    return this.list();
  }

  add({ track, requester = "anonymous", message = "" }) {
    const item = {
      id: `request-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      track,
      requester,
      message,
      status: "accepted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items.push(item);
    this.persist();
    return item;
  }

  cancel(id) {
    const item = this.items.find((request) => request.id === id);
    if (!item) return null;
    item.status = "cancelled";
    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  markPlayed(trackId) {
    const item = this.items.find((request) => request.track?.id === trackId && request.status === "accepted");
    if (!item) return null;
    item.status = "played";
    item.updatedAt = new Date().toISOString();
    this.persist();
    return item;
  }

  hasTrack(trackId) {
    return this.items.some((item) => item.track?.id === trackId && ["accepted", "pending"].includes(item.status));
  }

  lastByRequester(requester) {
    return [...this.items].reverse().find((item) => item.requester === requester);
  }

  list() {
    return {
      items: this.items.filter((item) => item.status !== "cancelled").slice(0, 100),
      total: this.items.length,
    };
  }

  status() {
    return {
      pending: this.items.filter((item) => item.status === "pending").length,
      accepted: this.items.filter((item) => item.status === "accepted").length,
      played: this.items.filter((item) => item.status === "played").length,
      cancelled: this.items.filter((item) => item.status === "cancelled").length,
    };
  }

  persist() {
    this.storage.write("requests", { items: this.items });
  }
}
