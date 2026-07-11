import fs from "node:fs";
import path from "node:path";

export const SUPPORTED_AUDIO_EXTENSIONS = new Set([".mp3", ".flac", ".wav", ".ogg", ".aac", ".m4a"]);

export class LibraryScanner {
  constructor({ libraryPath, logger = null, metadataEngine = null } = {}) {
    this.libraryPath = libraryPath;
    this.logger = logger;
    this.metadataEngine = metadataEngine;
  }

  async scan(libraryPath = this.libraryPath) {
    if (!libraryPath || !fs.existsSync(libraryPath)) {
      this.logger?.warn("library", "LibraryScanner: biblioteca nao encontrada.", { libraryPath });
      return [];
    }

    const tracks = [];
    const files = this.walk(libraryPath);

    for (const filePath of files) {
      try {
        if (!this.metadataEngine) {
          throw new Error("MetadataEngine nao configurado.");
        }
        tracks.push(await this.metadataEngine.read(filePath, libraryPath));
      } catch (error) {
        this.logger?.warn("library", "LibraryScanner: arquivo ignorado.", { filePath, error: error.message });
      }
    }

    return tracks;
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
