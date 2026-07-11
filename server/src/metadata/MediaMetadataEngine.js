import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFile } from "music-metadata";

import { CoverEngine } from "../covers/CoverEngine.js";
import { MetadataCache } from "./MetadataCache.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, "..", "..");
const mediaStorageRoot = path.resolve(serverRoot, "storage", "media");
const supportedExtensions = new Set([".mp3", ".flac", ".wav", ".ogg", ".aac", ".m4a"]);

function normalizePath(filePath) {
  return path.resolve(filePath)
    .replaceAll("\\", "/")
    .replace(/^\/mnt\/([a-z])\//i, "$1:/")
    .replace(/^([a-z]):\/+/i, (_, drive) => `${drive.toLowerCase()}:/`)
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function fallbackTitle(filePath) {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, " ").trim();
}

function fallbackArtistTitle(filePath) {
  const rawTitle = path.basename(filePath, path.extname(filePath)).trim();
  if (!rawTitle.includes(" - ")) {
    return { artist: "Artista nao identificado", title: fallbackTitle(filePath) };
  }
  const [artist, trackTitle] = rawTitle.split(" - ", 2).map((part) => part.trim());
  return {
    artist: artist || "Artista nao identificado",
    title: trackTitle || fallbackTitle(filePath),
  };
}

function firstValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value || "";
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return null;
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export class MediaMetadataEngine {
  constructor({ cachePath, coverFolder, logger = null, coverEngine = null } = {}) {
    this.logger = logger;
    this.ensureMediaStorage();
    this.cache = new MetadataCache({
      cachePath: cachePath || path.resolve(mediaStorageRoot, "cache", "metadata-cache.json"),
      logger,
    });
    this.coverEngine = coverEngine || new CoverEngine({
      coverFolder: coverFolder || path.resolve(mediaStorageRoot, "covers"),
      logger,
    });
    this.cache.load();
    this.performance = {
      processed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalMs: 0,
      coversExtracted: 0,
    };
  }

  ensureMediaStorage() {
    ["covers", "waveforms", "cache", "thumbs"].forEach((folder) => {
      fsSync.mkdirSync(path.resolve(mediaStorageRoot, folder), { recursive: true });
    });
  }

  async read(filePath, rootFolder = path.dirname(filePath)) {
    const startedAt = Date.now();
    const stats = await fs.stat(filePath);
    const cacheKey = this.createCacheKey(filePath, stats);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.metadataSchemaVersion === 4) {
      this.performance.cacheHits += 1;
      this.logger?.info("library", "Cache hit.", { filePath });
      return cached;
    }

    this.performance.cacheMisses += 1;
    this.logger?.info("library", "Cache miss.", { filePath });

    const metadata = await this.extract(filePath, rootFolder, stats);
    this.cache.set(cacheKey, metadata);
    this.cache.save();
    this.performance.processed += 1;
    this.performance.totalMs += Date.now() - startedAt;
    this.logger?.info("library", "Metadata loaded.", {
      filePath,
      title: metadata.title,
      artist: metadata.artist,
    });
    return metadata;
  }

  async extract(filePath, rootFolder, stats) {
    const extensionWithDot = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);
    const folder = path.relative(rootFolder, path.dirname(filePath)) || path.basename(rootFolder);
    const parentFolder = path.basename(path.dirname(filePath));
    const id = this.createStableId(filePath, stats);
    const hash = await this.createFileHash(filePath);
    const fallback = fallbackArtistTitle(filePath);
    const parsed = await this.parseMedia(filePath);
    const common = parsed.common || {};
    const format = parsed.format || {};
    const coverData = await this.coverEngine.process({ pictures: common.picture, trackHash: hash });

    if (coverData.coverPath) this.performance.coversExtracted += 1;

    const duration = format.duration ? Math.round(format.duration) : null;

    return {
      metadataSchemaVersion: 4,
      id,
      musicBrainzId: common.musicbrainz_trackid || common.musicbrainz_recordingid || null,
      isrc: firstValue(common.isrc) || null,
      title: common.title || fallback.title,
      artist: firstValue(common.artists) || common.artist || fallback.artist,
      albumArtist: common.albumartist || null,
      album: common.album || "Album desconhecido",
      genre: firstValue(common.genre) || parentFolder || "Sem genero",
      category: firstValue(common.genre) || parentFolder || "Sem categoria",
      year: this.toNumber(common.year),
      duration,
      durationFormatted: formatDuration(duration),
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
      codec: format.codec || format.container || extensionWithDot.slice(1).toUpperCase(),
      sampleRate: format.sampleRate || null,
      channels: format.numberOfChannels || null,
      trackNumber: common.track?.no || null,
      discNumber: common.disk?.no || null,
      composer: firstValue(common.composer) || null,
      publisher: firstValue(common.label) || common.publisher || null,
      copyright: common.copyright || null,
      comment: firstValue(common.comment) || null,
      bpm: this.toNumber(common.bpm),
      key: common.key || common.initialkey || null,
      cover: coverData.cover,
      coverHash: coverData.coverHash,
      coverPath: coverData.coverPath,
      coverMimeType: coverData.coverMimeType,
      coverAvailable: Boolean(coverData.coverAvailable),
      coverThumbnails: coverData.thumbnails || {},
      lyrics: firstValue(common.lyrics),
      language: common.language || "",
      hash,
      size: stats.size,
      extension: extensionWithDot,
      filename,
      folder,
      sourceFolder: folder,
      path: filePath,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      addedAt: new Date().toISOString(),
      mediaType: this.resolveMediaType(extensionWithDot),
    };
  }

  async parseMedia(filePath) {
    try {
      return await parseFile(filePath, {
        duration: true,
        skipCovers: false,
        skipPostHeaders: false,
      });
    } catch (error) {
      this.logger?.warn("library", "Falha ao ler metadata via music-metadata.", {
        filePath,
        error: error.message,
      });
      return { common: {}, format: {} };
    }
  }

  createStableId(filePath, stats) {
    return crypto
      .createHash("sha1")
      .update(`${normalizePath(filePath)}:${stats.size}:${stats.mtimeMs}`)
      .digest("hex");
  }

  async createFileHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }

  createCacheKey(filePath, stats) {
    return `${normalizePath(filePath)}:${stats.size}:${stats.mtimeMs}`;
  }

  resolveMediaType(extensionWithDot) {
    if (supportedExtensions.has(extensionWithDot)) return "audio";
    return "unknown";
  }

  toNumber(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  getById(id) {
    return this.cache.list().find((track) => track.id === id) || null;
  }

  getCacheInfo() {
    return this.cache.stats();
  }

  getStats(tracks = this.cache.list()) {
    const artists = new Set();
    const albums = new Set();
    const genres = new Set();
    const codecs = {};
    let bitrateTotal = 0;
    let bitrateCount = 0;
    let durationTotal = 0;

    tracks.forEach((track) => {
      if (track.artist) artists.add(track.artist);
      if (track.album) albums.add(track.album);
      if (track.genre) genres.add(track.genre);
      if (track.codec) codecs[track.codec] = (codecs[track.codec] || 0) + 1;
      if (track.bitrate) {
        bitrateTotal += Number(track.bitrate);
        bitrateCount += 1;
      }
      if (track.duration) durationTotal += Number(track.duration);
    });

    const topCodec = Object.entries(codecs).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      artists: artists.size,
      albums: albums.size,
      genres: genres.size,
      averageBitrate: bitrateCount ? Math.round(bitrateTotal / bitrateCount) : null,
      totalDuration: durationTotal,
      topCodec,
      processed: this.performance.processed,
      cacheHits: this.performance.cacheHits,
      cacheMisses: this.performance.cacheMisses,
      coversExtracted: this.performance.coversExtracted,
      averageReadMs: this.performance.processed
        ? Math.round(this.performance.totalMs / this.performance.processed)
        : 0,
      supportedExtensions: [...supportedExtensions],
    };
  }
}
