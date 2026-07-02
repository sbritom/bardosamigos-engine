import { spawn } from "node:child_process";
import { PassThrough, Readable } from "node:stream";
import fs from "node:fs";
import path from "node:path";

function executableCandidates(configuredPath) {
  if (configuredPath) return [configuredPath];
  if (process.platform === "win32") return ["ffmpeg.exe", "ffmpeg"];
  if (process.platform === "darwin") return ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"];
  return ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"];
}

function sanitizeArgs(args) {
  return args.map((arg, index) => {
    if (args[index - 1] === "-password") return "***";
    return String(arg).replace(/(icecasts?:\/\/[^:]+:)([^@]+)(@)/, "$1***$3");
  });
}

export class FFmpegEngine {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.executablePath = null;
    this.process = null;
    this.dryRun = Boolean(config.stream?.dryRun);
    this.command = "";
    this.sanitizedCommand = "";
    this.pid = null;
    this.startedAt = null;
    this.exitedAt = null;
    this.exitCode = null;
    this.signal = null;
    this.lastStdout = "";
    this.lastStderr = "";
    this.lastError = null;
  }

  detect() {
    const candidates = executableCandidates(this.config.ffmpeg?.executablePath);
    this.executablePath = candidates.find((candidate) => {
      if (candidate === "ffmpeg" || candidate === "ffmpeg.exe") return true;
      return fs.existsSync(candidate);
    }) || "ffmpeg";

    this.logger.info("ffmpeg", "FFmpeg detectado/configurado.", {
      executablePath: this.executablePath,
      platform: process.platform,
      dryRun: this.dryRun,
    });

    return this.executablePath;
  }

  ensureAvailable() {
    if (this.dryRun) return true;
    if (!this.executablePath) this.detect();
    if (this.executablePath.includes("/") || this.executablePath.includes("\\")) {
      if (!fs.existsSync(this.executablePath)) {
        throw new Error(`FFmpeg executable not found: ${this.executablePath}`);
      }
    }
    return true;
  }

  start(inputPath, args) {
    if (this.dryRun) {
      this.logger.info("ffmpeg", "FFmpeg dry-run iniciado.", { inputPath });
      const stream = new PassThrough();
      Readable.from([Buffer.from("bar-radio-dry-run-audio")]).pipe(stream);
      this.process = null;
      return { stream, process: null };
    }

    this.ensureAvailable();
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Audio file not found: ${inputPath}`);
    }

    this.command = [this.executablePath, ...args].join(" ");
    this.sanitizedCommand = [this.executablePath, ...sanitizeArgs(args)].join(" ");
    this.startedAt = new Date().toISOString();
    this.exitedAt = null;
    this.exitCode = null;
    this.signal = null;
    this.lastError = null;

    this.process = spawn(this.executablePath, args, {
      cwd: path.dirname(inputPath),
      windowsHide: true,
    });
    this.pid = this.process.pid || null;

    this.logger.info("ffmpeg", "FFmpeg iniciado.", {
      executablePath: this.executablePath,
      pid: this.pid,
      command: this.sanitizedCommand,
      args: sanitizeArgs(args),
    });

    this.process.stdout.on("data", (chunk) => {
      this.lastStdout = chunk.toString().trim();
      if (this.lastStdout) {
        this.logger.info("ffmpeg", "FFmpeg stdout.", { pid: this.pid, output: this.lastStdout });
      }
    });

    this.process.stderr.on("data", (chunk) => {
      this.lastStderr = chunk.toString().trim();
      if (this.lastStderr) {
        this.logger.info("ffmpeg", "FFmpeg stderr.", { pid: this.pid, output: this.lastStderr });
      }
    });

    this.process.on("exit", (code, signal) => {
      this.exitCode = code;
      this.signal = signal;
      this.exitedAt = new Date().toISOString();
      this.logger.info("ffmpeg", "FFmpeg finalizado.", {
        pid: this.pid,
        code,
        signal,
        stderr: this.lastStderr,
      });
    });

    this.process.on("error", (error) => {
      this.lastError = error.message;
      this.exitedAt = new Date().toISOString();
      this.logger.error("ffmpeg", "Falha ao iniciar FFmpeg.", {
        pid: this.pid,
        command: this.sanitizedCommand,
        error: error.message,
      });
    });

    return { stream: this.process.stdout, process: this.process };
  }

  stop() {
    if (this.process && !this.process.killed) {
      this.process.kill("SIGTERM");
    }
    this.process = null;
  }

  status() {
    const running = Boolean(this.process && !this.process.killed && this.process.exitCode === null);
    return {
      executablePath: this.executablePath,
      pid: this.pid,
      command: this.sanitizedCommand,
      running,
      status: running ? "RUNNING" : "OFFLINE",
      dryRun: this.dryRun,
      startedAt: this.startedAt,
      exitedAt: this.exitedAt,
      exitCode: this.exitCode,
      signal: this.signal,
      lastStdout: this.lastStdout,
      lastStderr: this.lastStderr,
      lastError: this.lastError,
    };
  }
}
