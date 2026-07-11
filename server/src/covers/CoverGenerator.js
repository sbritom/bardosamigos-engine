import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const sizes = Object.freeze([512, 256, 128, 64]);

function extensionFromMime(mimeType = "") {
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("webp")) return ".webp";
  return ".jpg";
}

function mimeFromExtension(filePath = "") {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

export class CoverGenerator {
  constructor({ coverFolder, thumbFolder, defaultCoverPath, logger = null } = {}) {
    this.coverFolder = coverFolder;
    this.thumbFolder = thumbFolder;
    this.defaultCoverPath = defaultCoverPath;
    this.logger = logger;
    fs.mkdirSync(this.coverFolder, { recursive: true });
    fs.mkdirSync(this.thumbFolder, { recursive: true });
    fs.mkdirSync(path.dirname(this.defaultCoverPath), { recursive: true });
  }

  async ensureDefaultCover() {
    if (!fs.existsSync(this.defaultCoverPath)) {
      await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: "#151316",
        },
      })
        .png()
        .toFile(this.defaultCoverPath);
    }

    await this.generateThumbnails(this.defaultCoverPath, "default-cover");
    return this.defaultCoverPath;
  }

  async generate({ imageBuffer, mimeType, trackHash }) {
    await this.ensureDefaultCover();

    if (!imageBuffer?.length || !trackHash) {
      this.logger?.info("library", "Default cover used.", { trackHash });
      return this.defaultPayload();
    }

    const extension = extensionFromMime(mimeType);
    const originalPath = path.join(this.coverFolder, `${trackHash}${extension}`);
    const cacheHit = fs.existsSync(originalPath);

    if (!cacheHit) {
      fs.writeFileSync(originalPath, imageBuffer);
      this.logger?.info("library", "Cover extracted.", { coverPath: originalPath, mimeType });
    } else {
      this.logger?.info("library", "Cover cached.", { coverPath: originalPath, mimeType });
    }

    const metadata = await sharp(originalPath).metadata();
    const thumbnails = await this.generateThumbnails(originalPath, trackHash);

    return {
      cover: originalPath,
      coverHash: trackHash,
      coverPath: originalPath,
      coverMimeType: mimeType || mimeFromExtension(originalPath),
      coverAvailable: true,
      dimensions: {
        width: metadata.width || null,
        height: metadata.height || null,
      },
      thumbnails,
      cacheHit,
      default: false,
    };
  }

  async generateThumbnails(sourcePath, trackHash) {
    const thumbnails = {};

    for (const size of sizes) {
      const thumbPath = path.join(this.thumbFolder, `${trackHash}-${size}.jpg`);
      if (!fs.existsSync(thumbPath)) {
        await sharp(sourcePath)
          .resize(size, size, { fit: "cover", position: "centre" })
          .jpeg({ quality: 86 })
          .toFile(thumbPath);
        this.logger?.info("library", "Thumbnail generated.", { size, thumbPath });
      }
      thumbnails[size] = thumbPath;
    }

    return thumbnails;
  }

  defaultPayload() {
    return {
      cover: this.defaultCoverPath,
      coverHash: null,
      coverPath: this.defaultCoverPath,
      coverMimeType: "image/png",
      coverAvailable: false,
      dimensions: { width: 1024, height: 1024 },
      thumbnails: this.defaultThumbnails(),
      cacheHit: true,
      default: true,
    };
  }

  defaultThumbnails() {
    return Object.fromEntries(sizes.map((size) => [
      size,
      path.join(this.thumbFolder, `default-cover-${size}.jpg`),
    ]));
  }
}
