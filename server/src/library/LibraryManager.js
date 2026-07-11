import path from "node:path";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { LibraryCache } from "./LibraryCache.js";
import { LibraryScanner } from "./LibraryScanner.js";
import { LibraryStatistics } from "./LibraryStatistics.js";
import { LibraryWatcher } from "./LibraryWatcher.js";
import { MediaMetadataEngine } from "../metadata/MediaMetadataEngine.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, "..", "..");

export class LibraryManager extends EventEmitter {
  constructor(config, logger = null, eventBus = null) {
    super();
    this.config = config;
    this.logger = logger;
    this.eventBus = eventBus;
    this.libraryPath = config.musicFolder;
    this.displayLibraryPath = config.libraryPath || config.musicFolder;
    this.cachePath = path.resolve(serverRoot, "storage", "library-cache.json");
    this.metadataEngine = new MediaMetadataEngine({ logger });
    this.scanner = new LibraryScanner({ libraryPath: this.libraryPath, logger, metadataEngine: this.metadataEngine });
    this.cache = new LibraryCache({ cachePath: this.cachePath, logger });
    this.watcher = new LibraryWatcher({
      libraryPath: this.libraryPath,
      logger,
      debounceMs: Number(config.libraryWatchDebounceMs || 1000),
      onReady: (status) => this.recordEvent("library:ready", status),
      onChange: (change) => {
        this.handleWatcherChange(change).catch((error) => {
          this.logger?.error("library", "Falha ao atualizar biblioteca pelo watcher.", { error: error.message });
        });
      },
    });
    this.tracks = [];
    this.stats = LibraryStatistics.generate([]);
    this.lastChanges = { added: [], removed: [], updated: [] };
    this.eventHistory = [];
    this.eventLimit = Number(config.libraryEventLimit || 100);
    this.rescanning = false;
    this.pendingRescan = false;
    this.ready = false;
  }

  async initialize() {
    if (this.libraryPath) {
      fs.mkdirSync(this.libraryPath, { recursive: true });
    }

    await this.rescan("initial");
    const watcherStatus = this.watcher.start();
    this.logger?.info("library", "Library Watcher monitorando.", {
      libraryPath: watcherStatus.libraryPath,
      subfolders: watcherStatus.folders,
      files: watcherStatus.files,
    });
    return this.getSummary();
  }

  async rescan(reason = "manual") {
    if (this.rescanning) {
      this.pendingRescan = true;
      return this.getSummary();
    }

    this.rescanning = true;
    let reconciled = { added: [], removed: [], updated: [], tracks: this.tracks };

    try {
      const loadedCacheData = this.cache.load();
      const cacheData = this.isSameLibraryCache(loadedCacheData)
        ? loadedCacheData
        : this.cache.empty();
      const scannedTracks = await this.scanner.scan(this.libraryPath);
      reconciled = this.cache.reconcile(cacheData.tracks, scannedTracks);
      const saved = this.cache.save({
        libraryPath: this.displayLibraryPath,
        tracks: reconciled.tracks,
      });

      this.tracks = saved.tracks;
      this.stats = LibraryStatistics.generate(this.tracks, saved.updatedAt);
      this.lastChanges = {
        added: reconciled.added,
        removed: reconciled.removed,
        updated: reconciled.updated,
      };
      this.ready = true;

      this.emitChangeEvents(reconciled, reason);

      this.logger?.info("library", "Library Manager inicializado.", {
        tracks: this.tracks.length,
        artists: this.stats.artistsCount,
        albums: this.stats.albumsCount,
        genres: this.stats.genresCount,
        cachePath: this.cachePath,
        reason,
      });
    } finally {
      this.rescanning = false;
    }

    if (this.pendingRescan) {
      this.pendingRescan = false;
      return this.rescan("pending");
    }

    return this.getSummary();
  }

  async handleWatcherChange(change) {
    const previousTotal = this.tracks.length;
    const summary = await this.rescan("watcher");

    this.logger?.info("library", "Biblioteca atualizada.", {
      reason: change.eventType,
      filePath: change.path,
      previousTracks: previousTotal,
      tracks: this.stats.totalTracks,
      artists: this.stats.artistsCount,
      albums: this.stats.albumsCount,
      genres: this.stats.genresCount,
      folders: this.stats.foldersCount,
      totalSize: this.stats.totalSize,
    });

    return summary;
  }

  emitChangeEvents(changes, reason) {
    changes.added.forEach((track) => {
      this.logger?.info("library", "Nova musica detectada.", this.trackLogContext(track));
      this.recordEvent("track:added", { track, reason });
    });

    changes.removed.forEach((track) => {
      this.logger?.info("library", "Musica removida.", this.trackLogContext(track));
      this.recordEvent("track:removed", { track, reason });
    });

    changes.updated.forEach((track) => {
      this.logger?.info("library", "Musica atualizada.", this.trackLogContext(track));
      this.recordEvent("track:updated", { track, reason });
    });

    if (changes.added.length || changes.removed.length || changes.updated.length) {
      this.recordEvent("library:changed", {
        reason,
        tracks: this.tracks.length,
        stats: this.stats,
        changes: {
          added: changes.added.length,
          removed: changes.removed.length,
          updated: changes.updated.length,
        },
      });
    }
  }

  recordEvent(type, payload = {}) {
    const event = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      payload,
      emittedAt: new Date().toISOString(),
    };

    this.eventHistory.unshift(event);
    this.eventHistory = this.eventHistory.slice(0, this.eventLimit);
    this.emit(type, event);
    this.eventBus?.emit(type, event);
    return event;
  }

  trackLogContext(track) {
    return {
      name: track.filename,
      folder: track.sourceFolder,
      artist: track.artist,
      genre: track.genre,
      id: track.id,
      path: track.path,
    };
  }

  isSameLibraryCache(cacheData) {
    if (!cacheData?.libraryPath) return true;
    const currentPaths = [this.displayLibraryPath, this.libraryPath].map((value) => this.normalizePath(value));
    return currentPaths.includes(this.normalizePath(cacheData.libraryPath));
  }

  normalizePath(value) {
    return String(value || "")
      .replaceAll("\\", "/")
      .replace(/^\/mnt\/([a-z])\//i, "$1:/")
      .replace(/^([a-z]):\/+/i, (_, drive) => `${drive.toLowerCase()}:/`)
      .replace(/\/+/g, "/")
      .toLowerCase();
  }

  getTracks() {
    return this.tracks;
  }

  list() {
    return this.getTracks();
  }

  getStats() {
    return this.stats;
  }

  getGenres() {
    return this.stats.genres;
  }

  getArtists() {
    return this.stats.artists;
  }

  getAlbums() {
    return this.stats.albums;
  }

  getFolders() {
    return this.stats.folders;
  }

  findById(id) {
    return this.tracks.find((track) => track.id === id) || null;
  }

  search(query) {
    const normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return this.getTracks();

    return this.tracks.filter((track) =>
      [track.title, track.artist, track.album, track.genre, track.filename].some((value) =>
        String(value || "").toLowerCase().includes(normalized),
      ),
    );
  }

  getEvents(limit = this.eventLimit) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || this.eventLimit, this.eventLimit));
    return this.eventHistory.slice(0, safeLimit);
  }

  getWatcherStatus() {
    return this.watcher.getStatus();
  }

  stop() {
    this.watcher.stop();
  }

  getSummary() {
    return {
      ready: this.ready,
      libraryPath: this.displayLibraryPath,
      fsPath: this.libraryPath,
      cachePath: this.cachePath,
      metadataCache: this.metadataEngine.getCacheInfo(),
      tracks: this.tracks.length,
      stats: this.stats,
      changes: this.lastChanges,
      watcher: this.getWatcherStatus(),
      events: this.eventHistory.length,
    };
  }
}
