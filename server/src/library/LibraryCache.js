import fs from "node:fs";
import path from "node:path";

export class LibraryCache {
  constructor({ cachePath, logger = null } = {}) {
    this.cachePath = cachePath;
    this.logger = logger;
  }

  load() {
    if (!this.cachePath || !fs.existsSync(this.cachePath)) {
      return this.empty();
    }

    try {
      return {
        ...this.empty(),
        ...JSON.parse(fs.readFileSync(this.cachePath, "utf8")),
      };
    } catch (error) {
      this.logger?.warn("library", "LibraryCache: cache invalido, recriando.", {
        cachePath: this.cachePath,
        error: error.message,
      });
      return this.empty();
    }
  }

  save({ libraryPath, tracks }) {
    fs.mkdirSync(path.dirname(this.cachePath), { recursive: true });
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      libraryPath,
      tracks,
    };
    fs.writeFileSync(this.cachePath, JSON.stringify(payload, null, 2), "utf8");
    return payload;
  }

  reconcile(cachedTracks = [], scannedTracks = []) {
    const cachedByPath = new Map(cachedTracks.map((track) => [this.key(track.path), track]));
    const scannedByPath = new Map(scannedTracks.map((track) => [this.key(track.path), track]));
    const added = [];
    const removed = [];
    const updated = [];
    const tracks = [];

    scannedByPath.forEach((track, key) => {
      const cached = cachedByPath.get(key);
      if (!cached) {
        added.push(track);
        tracks.push(track);
        return;
      }

      if (cached.id !== track.id || cached.size !== track.size || cached.modifiedAt !== track.modifiedAt) {
        updated.push(track);
        tracks.push({ ...track, addedAt: cached.addedAt || track.addedAt });
        return;
      }

      tracks.push({ ...track, addedAt: cached.addedAt || track.addedAt });
    });

    cachedByPath.forEach((track, key) => {
      if (!scannedByPath.has(key)) removed.push(track);
    });

    return { tracks, added, removed, updated };
  }

  empty() {
    return {
      version: 1,
      updatedAt: null,
      libraryPath: "",
      tracks: [],
    };
  }

  key(filePath) {
    return String(filePath || "")
      .replaceAll("\\", "/")
      .replace(/^\/mnt\/([a-z])\//i, "$1:/")
      .replace(/^([a-z]):\/+/i, (_, drive) => `${drive.toLowerCase()}:/`)
      .replace(/\/+/g, "/")
      .toLowerCase();
  }
}
