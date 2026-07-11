export class AudienceApi {
  constructor(audienceEngine) {
    this.audience = audienceEngine;
  }

  summary() {
    return this.audience?.summary?.() || null;
  }

  stats() {
    return this.audience?.statistics?.get?.() || {};
  }

  history() {
    return this.audience?.history?.list?.() || { items: [] };
  }

  mostPlayed() {
    return this.audience?.mostPlayed?.list?.() || { tracks: [] };
  }

  favorites() {
    return this.audience?.favorites?.get?.() || {};
  }

  requests() {
    return this.audience?.requests?.list?.() || { items: [] };
  }

  createRequest(payload) {
    return this.audience?.requests?.create?.(payload) || { accepted: false, error: "AUDIENCE_DISABLED" };
  }

  cancelRequest(id) {
    return this.audience?.requests?.cancel?.(id) || { cancelled: false, error: "AUDIENCE_DISABLED" };
  }
}
