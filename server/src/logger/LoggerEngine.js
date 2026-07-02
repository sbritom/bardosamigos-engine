import fs from "node:fs";
import path from "node:path";

const logFiles = Object.freeze({
  engine: "engine.log",
  library: "library.log",
  playlist: "playlist.log",
  autodj: "autodj.log",
  scheduler: "scheduler.log",
  history: "history.log",
  events: "events.log",
  api: "api.log",
  stream: "stream.log",
  ffmpeg: "ffmpeg.log",
  icecast: "icecast.log",
  recovery: "recovery.log",
  startup: "startup.log",
  shutdown: "shutdown.log",
  track: "track.log",
  errors: "errors.log",
});

export class LoggerEngine {
  constructor(config) {
    this.config = config;
    this.ready = false;
  }

  init() {
    fs.mkdirSync(this.config.logFolder, { recursive: true });
    Object.values(logFiles).forEach((fileName) => {
      const filePath = path.join(this.config.logFolder, fileName);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "", "utf8");
      }
    });
    this.ready = true;
    this.info("engine", "Logger iniciado.");
  }

  write(channel, level, message, context = {}) {
    const fileName = logFiles[channel] || logFiles.engine;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    const line = `${JSON.stringify(entry)}\n`;

    fs.appendFileSync(path.join(this.config.logFolder, fileName), line, "utf8");
    return entry;
  }

  info(channel, message, context) {
    return this.write(channel, "info", message, context);
  }

  warn(channel, message, context) {
    return this.write(channel, "warn", message, context);
  }

  error(channel, message, context) {
    this.write("errors", "error", message, { channel, ...context });
    return this.write(channel, "error", message, context);
  }
}
