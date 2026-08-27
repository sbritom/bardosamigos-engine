export class RequestValidator {
  constructor({ config, libraryManager, requestQueue }) {
    this.config = config;
    this.libraryManager = libraryManager;
    this.requestQueue = requestQueue;
  }

  validate(payload = {}) {
    if (!this.config.enabled || !this.config.allowRequests) {
      return this.reject("REQUESTS_DISABLED", "Pedidos desativados.");
    }

    const trackId = payload.trackId || payload.id;
    const track = this.findTrack(trackId);
    if (!track) return this.reject("TRACK_NOT_FOUND", "Musica nao encontrada.");

    if (!this.config.allowDuplicates && this.requestQueue.hasTrack(track.id)) {
      return this.reject("DUPLICATE_REQUEST", "Esta musica ja esta na fila de pedidos.");
    }

    const requester = payload.requester || payload.userId || "anonymous";
    const lastRequest = this.requestQueue.lastByRequester(requester);
    const minimumIntervalMs = Number(this.config.minimumInterval || 0) * 1000;
    if (lastRequest && Date.now() - new Date(lastRequest.createdAt).getTime() < minimumIntervalMs) {
      return this.reject("MINIMUM_INTERVAL", "Aguarde antes de fazer outro pedido.");
    }

    return { ok: true, track, requester };
  }

  findTrack(trackId) {
    return (this.libraryManager?.getTracks?.() || []).find((track) => track.id === trackId || track.hash === trackId || track.path === trackId);
  }

  reject(code, message) {
    return { ok: false, code, message };
  }
}
