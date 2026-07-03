import fs from "node:fs";
import path from "node:path";

import { SUPPORTED_AUDIO_EXTENSIONS } from "./LibraryScanner.js";

function isAudioPath(filePath) {
  return SUPPORTED_AUDIO_EXTENSIONS.has(path.extname(filePath || "").toLowerCase());
}

export class LibraryWatcher {
  constructor({
    libraryPath,
    logger = null,
    debounceMs = 1000,
    onChange = null,
    onReady = null,
  } = {}) {
    this.libraryPath = libraryPath;
    this.logger = logger;
    this.debounceMs = debounceMs;
    this.onChange = onChange;
    this.onReady = onReady;
    this.watchers = new Map();
    this.debounceTimers = new Map();
    this.started = false;
  }

  start() {
    if (!this.libraryPath) {
      this.logger?.warn("library", "Library Watcher: caminho da biblioteca nao informado.");
      return this.getStatus();
    }

    fs.mkdirSync(this.libraryPath, { recursive: true });
    this.refreshWatchers();
    this.started = true;

    const status = this.getStatus();
    this.logger?.info("library", "Library Watcher iniciado.", {
      libraryPath: this.libraryPath,
      folders: status.folders,
      files: status.files,
    });
    this.onReady?.(status);
    return status;
  }

  refreshWatchers() {
    const folders = this.collectFolders(this.libraryPath);
    const activeKeys = new Set(folders.map((folder) => this.key(folder)));

    [...this.watchers.entries()].forEach(([key, watcher]) => {
      if (!activeKeys.has(key)) {
        watcher.close();
        this.watchers.delete(key);
      }
    });

    folders.forEach((folder) => this.watchFolder(folder));
  }

  watchFolder(folder) {
    const key = this.key(folder);
    if (this.watchers.has(key)) return;

    try {
      const watcher = fs.watch(folder, { persistent: true }, (eventType, filename) => {
        const fullPath = filename ? path.join(folder, filename.toString()) : folder;
        this.handleFsEvent(eventType, fullPath);
      });

      watcher.on("error", (error) => {
        this.logger?.warn("library", "Library Watcher: falha ao monitorar pasta.", {
          folder,
          error: error.message,
        });
      });

      this.watchers.set(key, watcher);
    } catch (error) {
      this.logger?.warn("library", "Library Watcher: pasta ignorada.", { folder, error: error.message });
    }
  }

  handleFsEvent(eventType, filePath) {
    const targetPath = path.resolve(filePath);
    let stats = null;

    try {
      stats = fs.existsSync(targetPath) ? fs.statSync(targetPath) : null;
    } catch {
      stats = null;
    }

    if (stats?.isDirectory()) {
      this.refreshWatchers();
      this.schedule(targetPath, eventType);
      return;
    }

    if (!isAudioPath(targetPath)) return;
    this.schedule(targetPath, eventType);
  }

  schedule(filePath, eventType) {
    const key = this.key(filePath);
    clearTimeout(this.debounceTimers.get(key));

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.refreshWatchers();
      this.onChange?.({
        eventType,
        path: filePath,
        detectedAt: new Date().toISOString(),
      });
    }, this.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  getStatus() {
    const folders = this.collectFolders(this.libraryPath);
    return {
      online: this.started,
      libraryPath: this.libraryPath,
      watchedFolders: this.watchers.size,
      folders: folders.length,
      files: this.countAudioFiles(this.libraryPath),
      debounceMs: this.debounceMs,
    };
  }

  stop() {
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers.clear();
    this.started = false;
  }

  collectFolders(rootFolder) {
    if (!rootFolder || !fs.existsSync(rootFolder)) return [];

    const folders = [rootFolder];
    for (const folder of folders) {
      let entries = [];
      try {
        entries = fs.readdirSync(folder, { withFileTypes: true });
      } catch {
        continue;
      }

      entries.forEach((entry) => {
        if (entry.isDirectory()) folders.push(path.join(folder, entry.name));
      });
    }

    return folders;
  }

  countAudioFiles(rootFolder) {
    if (!rootFolder || !fs.existsSync(rootFolder)) return 0;
    return this.collectFolders(rootFolder).reduce((total, folder) => {
      try {
        return total + fs
          .readdirSync(folder, { withFileTypes: true })
          .filter((entry) => entry.isFile() && isAudioPath(entry.name))
          .length;
      } catch {
        return total;
      }
    }, 0);
  }

  key(filePath) {
    return path.resolve(filePath || "").replaceAll("\\", "/").toLowerCase();
  }
}
