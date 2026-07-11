import { RequestQueue } from "./RequestQueue.js";
import { RequestValidator } from "./RequestValidator.js";

export class RequestEngine {
  constructor({ config, storage, libraryManager, logger, eventBus }) {
    this.config = config;
    this.logger = logger;
    this.eventBus = eventBus;
    this.queue = new RequestQueue(storage);
    this.validator = new RequestValidator({ config, libraryManager, requestQueue: this.queue });
  }

  init() {
    this.queue.init();
  }

  create(payload = {}) {
    this.eventBus?.emit("request:created", { payload });
    const validation = this.validator.validate(payload);
    if (!validation.ok) {
      this.logger?.warn("requests", "Request rejected.", validation);
      this.eventBus?.emit("request:rejected", validation);
      return { accepted: false, ...validation };
    }

    const item = this.queue.add({
      track: validation.track,
      requester: validation.requester,
      message: payload.message || "",
    });
    this.logger?.info("requests", "Request accepted.", { requestId: item.id, trackId: item.track.id });
    this.eventBus?.emit("request:accepted", item);
    return { accepted: true, item };
  }

  cancel(id) {
    const item = this.queue.cancel(id);
    return item ? { cancelled: true, item } : { cancelled: false, error: "REQUEST_NOT_FOUND" };
  }

  list() {
    return {
      ...this.queue.list(),
      status: this.queue.status(),
    };
  }

  markPlayed(trackId) {
    const item = this.queue.markPlayed(trackId);
    if (item) this.eventBus?.emit("request:played", item);
    return item;
  }
}
