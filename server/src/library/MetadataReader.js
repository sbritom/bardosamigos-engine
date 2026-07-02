import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const audioExtensions = new Set([".mp3", ".aac", ".ogg", ".wav", ".flac", ".m4a"]);

function titleFromFile(filePath) {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, " ").trim();
}

function parseArtistAndTitle(filePath) {
  const rawTitle = path.basename(filePath, path.extname(filePath)).trim();
  if (!rawTitle.includes(" - ")) {
    return { artist: "Artista nao identificado", title: titleFromFile(filePath) };
  }

  const [artist, trackTitle] = rawTitle.split(" - ", 2).map((part) => part.trim());
  return {
    artist: artist || "Artista nao identificado",
    title: trackTitle || titleFromFile(filePath),
  };
}

export function isSupportedAudio(filePath) {
  return audioExtensions.has(path.extname(filePath).toLowerCase());
}

export function readMetadata(filePath) {
  const stats = fs.statSync(filePath);
  const extension = path.extname(filePath).toLowerCase().slice(1);
  const category = path.basename(path.dirname(filePath));
  const { artist, title } = parseArtistAndTitle(filePath);
  const hash = crypto
    .createHash("sha1")
    .update(`${filePath}:${stats.size}:${stats.mtimeMs}`)
    .digest("hex");

  return {
    id: hash,
    title,
    artist,
    album: "",
    genre: category,
    category,
    year: null,
    track: null,
    duration: 0,
    bitrate: null,
    sampleRate: null,
    channels: null,
    codec: extension.toUpperCase(),
    cover: "",
    path: filePath,
    extension,
    hash,
    size: stats.size,
  };
}
