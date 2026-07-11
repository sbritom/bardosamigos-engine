export class CoverApi {
  constructor({ coverEngine, libraryManager } = {}) {
    this.coverEngine = coverEngine;
    this.libraryManager = libraryManager;
  }

  resolve(trackId, size = null) {
    const track = this.libraryManager?.findById(trackId);
    if (!track && trackId !== "default") return this.coverEngine.defaultImage();
    if (trackId === "default") return this.coverEngine.defaultImage();
    return this.coverEngine.resolve(track, size);
  }

  stats() {
    return this.coverEngine.stats(this.libraryManager?.getTracks?.() || null);
  }
}
