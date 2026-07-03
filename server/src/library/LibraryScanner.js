import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const SUPPORTED_AUDIO_EXTENSIONS = new Set([".mp3", ".flac", ".wav", ".ogg", ".aac", ".m4a"]);

function normalizePath(filePath) {
  return path.resolve(filePath)
    .replaceAll("\\", "/")
    .replace(/^\/mnt\/([a-z])\//i, "$1:/")
    .replace(/^([a-z]):\/+/i, (_, drive) => `${drive.toLowerCase()}:/`)
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function createTrackId(filePath, stats) {
  return crypto
    .createHash("sha1")
    .update(`${normalizePath(filePath)}:${stats.size}:${stats.mtimeMs}`)
    .digest("hex");
}

function createFallbackMetadata(filePath, rootFolder, stats) {
  const extension = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);
  const title = path.basename(filePath, extension);
  const parentFolder = path.basename(path.dirname(filePath));
  const sourceFolder = path.relative(rootFolder, path.dirname(filePath)) || path.basename(rootFolder);

  return {
    id: createTrackId(filePath, stats),
    path: filePath,
    filename,
    extension,
    size: stats.size,
    modifiedAt: stats.mtime.toISOString(),
    addedAt: new Date().toISOString(),
    title,
    artist: "Artista desconhecido",
    album: "Album desconhecido",
    genre: parentFolder || "Sem genero",
    duration: null,
    bitrate: null,
    sourceFolder,
  };
}

export class LibraryScanner {
  constructor({ libraryPath, logger = null } = {}) {
    this.libraryPath = libraryPath;
    this.logger = logger;
  }

  scan(libraryPath = this.libraryPath) {
    if (!libraryPath || !fs.existsSync(libraryPath)) {
      this.logger?.warn("library", "LibraryScanner: biblioteca nao encontrada.", { libraryPath });
      return [];
    }

    return this.walk(libraryPath)
      .map((filePath) => {
        try {
          const stats = fs.statSync(filePath);
          return createFallbackMetadata(filePath, libraryPath, stats);
        } catch (error) {
          this.logger?.warn("library", "LibraryScanner: arquivo ignorado.", { filePath, error: error.message });
          return null;
        }
      })
      .filter(Boolean);
  }

  walk(folder) {
    let entries = [];
    try {
      entries = fs.readdirSync(folder, { withFileTypes: true });
    } catch (error) {
      this.logger?.warn("library", "LibraryScanner: pasta ignorada.", { folder, error: error.message });
      return [];
    }

    return entries.flatMap((entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) return this.walk(fullPath);
      if (entry.isFile() && SUPPORTED_AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        return [fullPath];
      }
      return [];
    });
  }
}
