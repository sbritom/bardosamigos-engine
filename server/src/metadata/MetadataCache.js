import fs from "node:fs";
import path from "node:path";

export class MetadataCache {
  constructor({ cachePath, logger = null } = {}) {
    this.cachePath = cachePath;
    this.logger = logger;
    this.data = this.empty();
  }

  load() {
    if (!this.cachePath || !fs.existsSync(this.cachePath)) {
      this.data = this.empty();
      return this.data;
    }

    try {
      this.data = {
        ...this.empty(),
        ...JSON.parse(fs.readFileSync(this.cachePath, "utf8")),
      };
    } catch (error) {
      this.logger?.warn("library", "Metadata cache invalido, recriando.", {
        cachePath: this.cachePath,
        error: error.message,
      });
      this.data = this.empty();
    }

    return this.data;
  }

  save() {
    fs.mkdirSync(path.dirname(this.cachePath), { recursive: true });
    this.data.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.cachePath, JSON.stringify(this.data, null, 2), "utf8");
    return this.data;
  }

  get(cacheKey) {
    return this.data.items[cacheKey] || null;
  }

  set(cacheKey, metadata) {
    this.data.items[cacheKey] = metadata;
    return metadata;
  }

  list() {
    return Object.values(this.data.items);
  }

  stats() {
    return {
      cachePath: this.cachePath,
      totalItems: Object.keys(this.data.items).length,
      updatedAt: this.data.updatedAt,
    };
  }

  empty() {
    return {
      version: 1,
      updatedAt: null,
      items: {},
    };
  }
}
