export class MetadataApi {
  constructor(metadataEngine, libraryManager = null) {
    this.metadataEngine = metadataEngine;
    this.libraryManager = libraryManager;
  }

  get(id) {
    return this.libraryManager?.findById(id) || this.metadataEngine?.getById(id) || null;
  }

  cache() {
    return this.metadataEngine?.getCacheInfo() || {};
  }

  stats() {
    return this.metadataEngine?.getStats(this.libraryManager?.getTracks?.() || undefined) || {};
  }
}
