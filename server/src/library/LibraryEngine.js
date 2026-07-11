import fs from "node:fs";
import path from "node:path";
import { isSupportedAudio } from "./MetadataReader.js";
import { MediaMetadataEngine } from "../metadata/MediaMetadataEngine.js";

export class LibraryEngine {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.cache = new Map();
    this.watchers = [];
    this.metadataEngine = new MediaMetadataEngine({ logger });
  }

  async init() {
    fs.mkdirSync(this.config.cacheFolder, { recursive: true });
    if (!this.config.libraryPathFound || !fs.existsSync(this.config.musicFolder)) {
      this.logger.warn("library", "Library not found.", {
        candidates: this.config.libraryPathCandidates,
      });
      this.writeCache();
      return;
    }

    this.logger.info("library", "Biblioteca usando caminho detectado pela ConfigEngine.", {
      path: this.config.libraryPath,
      fsPath: this.config.musicFolder,
    });
    await this.reindex();
    this.watch();
    this.logger.info("library", "Biblioteca carregada.", { tracks: this.cache.size });
  }

  walk(folder) {
    let entries = [];
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true });
    } catch (error) {
      this.logger.warn("library", "Pasta ignorada durante leitura da biblioteca.", { folder, error: error.message });
      return [];
    }

    const files = [];

    entries.forEach((entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.walk(fullPath));
      } else if (isSupportedAudio(fullPath)) {
        files.push(fullPath);
      }
    });

    return files;
  }

  async reindex() {
    this.cache.clear();
    const files = this.walk(this.config.musicFolder);
    for (const filePath of files) {
      try {
        const metadata = await this.metadataEngine.read(filePath, this.config.musicFolder);
        this.cache.set(metadata.id, metadata);
      } catch (error) {
        this.logger.warn("library", "Arquivo de audio ignorado.", { filePath, error: error.message });
      }
    }
    this.writeCache();
    return this.list();
  }

  watch() {
    this.closeWatchers();
    const folders = [this.config.musicFolder, ...this.walkDirectories(this.config.musicFolder)];
    folders.forEach((folder) => {
      const watcher = fs.watch(folder, { persistent: false }, () => {
        clearTimeout(this.reindexTimer);
        this.reindexTimer = setTimeout(() => {
          this.reindex().catch((error) => {
            this.logger.warn("library", "Falha ao reindexar biblioteca.", { error: error.message });
          });
          this.logger.info("library", "Biblioteca atualizada.", { tracks: this.cache.size });
        }, 250);
      });
      this.watchers.push(watcher);
    });
  }

  walkDirectories(folder) {
    let entries = [];
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true });
    } catch {
      return [];
    }

    return entries
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const fullPath = path.join(folder, entry.name);
        return [fullPath, ...this.walkDirectories(fullPath)];
      });
  }

  closeWatchers() {
    clearTimeout(this.reindexTimer);
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers = [];
  }

  list() {
    return Array.from(this.cache.values());
  }

  get(id) {
    return this.cache.get(id) || null;
  }

  findById(id) {
    return this.get(id);
  }

  findByArtist(artist) {
    return this.findByField("artist", artist);
  }

  findByAlbum(album) {
    return this.findByField("album", album);
  }

  findByGenre(genre) {
    return this.findByField("genre", genre);
  }

  findByCategory(category) {
    return this.findByField("category", category);
  }

  findByTitle(title) {
    return this.findByField("title", title);
  }

  findByField(field, value) {
    const normalized = String(value || "").toLowerCase();
    return this.list().filter((track) => String(track[field] || "").toLowerCase() === normalized);
  }

  search(query) {
    const normalized = String(query || "").toLowerCase();
    if (!normalized) return this.list();
    return this.list().filter((track) =>
      [track.title, track.artist, track.album, track.genre, track.category].some((value) =>
        String(value || "").toLowerCase().includes(normalized),
      ),
    );
  }

  random() {
    const tracks = this.list();
    if (tracks.length === 0) return null;
    return tracks[Math.floor(Math.random() * tracks.length)];
  }

  writeCache() {
    const cachePath = path.join(this.config.cacheFolder, "library-cache.json");
    fs.writeFileSync(cachePath, JSON.stringify({
      updatedAt: new Date().toISOString(),
      tracks: this.list(),
    }, null, 2), "utf8");
  }
}
