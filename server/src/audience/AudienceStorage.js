import fs from "node:fs";
import path from "node:path";

export class AudienceStorage {
  constructor({ storagePath }) {
    this.storagePath = storagePath;
  }

  init() {
    fs.mkdirSync(this.storagePath, { recursive: true });
    ["requests", "favorites", "statistics", "history", "most-played"].forEach((name) => {
      const filePath = this.filePath(name);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(this.empty(name), null, 2), "utf8");
      }
    });
  }

  filePath(name) {
    return path.join(this.storagePath, `${name}.json`);
  }

  read(name) {
    this.init();
    try {
      return JSON.parse(fs.readFileSync(this.filePath(name), "utf8"));
    } catch {
      return this.empty(name);
    }
  }

  write(name, data) {
    this.init();
    fs.writeFileSync(this.filePath(name), JSON.stringify(data, null, 2), "utf8");
    return data;
  }

  empty(name) {
    if (name === "requests") return { items: [] };
    if (name === "favorites") return { tracks: {}, artists: {}, albums: {}, genres: {} };
    if (name === "statistics") return { totals: {}, tracks: {}, artists: {}, albums: {}, genres: {}, audience: {} };
    if (name === "history") return { items: [] };
    if (name === "most-played") return { tracks: [] };
    return {};
  }
}
