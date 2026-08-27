import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CoverCache } from "./CoverCache.js";
import { CoverGenerator } from "./CoverGenerator.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, "..", "..");
const mediaRoot = path.resolve(serverRoot, "storage", "media");
const publicRoot = path.resolve(serverRoot, "..", "public", "assets");

export class CoverEngine {
  constructor({ logger = null, cachePath, coverFolder, thumbFolder, defaultCoverPath } = {}) {
    this.logger = logger;
    this.coverFolder = coverFolder || path.resolve(mediaRoot, "covers");
    this.thumbFolder = thumbFolder || path.resolve(mediaRoot, "thumbs");
    this.cachePath = cachePath || path.resolve(mediaRoot, "cache", "cover-cache.json");
    this.defaultCoverPath = defaultCoverPath || path.resolve(publicRoot, "default-cover.png");
    this.cache = new CoverCache({ cachePath: this.cachePath, logger });
    this.generator = new CoverGenerator({
      coverFolder: this.coverFolder,
      thumbFolder: this.thumbFolder,
      defaultCoverPath: this.defaultCoverPath,
      logger,
    });
    this.cache.load();
    this.statsState = {
      coversExtracted: 0,
      coversCached: 0,
      coversMissing: 0,
      thumbnailsGenerated: 0,
    };
  }

  async process({ pictures = [], trackHash } = {}) {
    await this.generator.ensureDefaultCover();

    const cached = this.cache.get(trackHash);
    if (cached && this.isCoverComplete(cached)) {
      this.statsState.coversCached += 1;
      this.logger?.info("library", "Cover cached.", { trackHash, coverPath: cached.coverPath });
      return cached;
    }

    const picture = Array.isArray(pictures) ? pictures[0] : null;
    if (!picture?.data?.length) {
      this.statsState.coversMissing += 1;
      const payload = this.generator.defaultPayload();
      this.cache.set(trackHash || `missing-${Date.now()}`, payload);
      this.cache.save();
      this.logger?.info("library", "Default cover used.", { trackHash });
      return payload;
    }

    const beforeThumbs = this.countFiles(this.thumbFolder);
    const payload = await this.generator.generate({
      imageBuffer: picture.data,
      mimeType: picture.format,
      trackHash,
    });
    const afterThumbs = this.countFiles(this.thumbFolder);

    this.statsState.coversExtracted += payload.cacheHit ? 0 : 1;
    this.statsState.coversCached += payload.cacheHit ? 1 : 0;
    this.statsState.thumbnailsGenerated += Math.max(0, afterThumbs - beforeThumbs);
    this.cache.set(trackHash, payload);
    this.cache.save();
    return payload;
  }

  resolve(track, size = null) {
    let payload = this.cache.get(track?.hash) || this.fromTrack(track) || this.generator.defaultPayload();
    if (payload.default && !payload.thumbnails?.[512]) {
      payload = this.generator.defaultPayload();
      if (track?.hash) {
        this.cache.set(track.hash, payload);
        this.cache.save();
      }
    }
    const filePath = size ? payload.thumbnails?.[size] : payload.coverPath;
    if (filePath && fs.existsSync(filePath)) {
      return {
        filePath,
        mimeType: size ? "image/jpeg" : payload.coverMimeType || this.mimeFromPath(filePath),
        payload,
      };
    }

    return this.defaultImage();
  }

  defaultImage() {
    return {
      filePath: this.defaultCoverPath,
      mimeType: "image/png",
      payload: this.generator.defaultPayload(),
    };
  }

  fromTrack(track) {
    if (!track?.coverPath) return null;
    return {
      cover: track.cover || track.coverPath,
      coverHash: track.coverHash,
      coverPath: track.coverPath,
      coverMimeType: track.coverMimeType,
      coverAvailable: Boolean(track.coverAvailable),
      thumbnails: track.coverThumbnails || {},
      default: !track.coverAvailable,
    };
  }

  isCoverComplete(payload) {
    const thumbs = payload?.thumbnails || {};
    return Boolean(
      payload?.coverPath &&
      fs.existsSync(payload.coverPath) &&
      [512, 256, 128, 64].every((size) => thumbs[size] && fs.existsSync(thumbs[size])),
    );
  }

  stats(tracks = null) {
    if (Array.isArray(tracks)) {
      const items = tracks.map((track) => this.cache.get(track.hash) || this.fromTrack(track) || this.generator.defaultPayload());
      return {
        ...this.statsState,
        coversCached: items.filter((item) => item.coverAvailable).length,
        coversMissing: items.filter((item) => !item.coverAvailable).length,
        storageUsed: this.storageUsed(),
        cache: this.cache.stats(),
      };
    }

    return {
      ...this.statsState,
      coversCached: this.cache.list().filter((item) => item.coverAvailable).length,
      coversMissing: this.cache.list().filter((item) => !item.coverAvailable).length,
      storageUsed: this.storageUsed(),
      cache: this.cache.stats(),
    };
  }

  storageUsed() {
    return [this.coverFolder, this.thumbFolder, path.dirname(this.cachePath)].reduce(
      (total, folder) => total + this.folderSize(folder),
      0,
    );
  }

  folderSize(folder) {
    if (!fs.existsSync(folder)) return 0;
    return fs.readdirSync(folder, { withFileTypes: true }).reduce((total, entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) return total + this.folderSize(fullPath);
      return total + fs.statSync(fullPath).size;
    }, 0);
  }

  countFiles(folder) {
    if (!fs.existsSync(folder)) return 0;
    return fs.readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isFile()).length;
  }

  mimeFromPath(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === ".png") return "image/png";
    if (extension === ".webp") return "image/webp";
    return "image/jpeg";
  }
}
