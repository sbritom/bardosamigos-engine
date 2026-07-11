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

function sanitizeText(value) {
  return String(value || "")
    .replace(/(icecasts?:\/\/[^:]+:)([^@]+)(@)/g, "$1***$3")
    .replace(/(-password\s+)(\S+)/g, "$1***");
}

export class FFmpegEngine {
  constructor(config, logger, { spawnFactory = spawn } = {}) {
    this.config = config;
    this.logger = logger;
    this.spawnFactory = spawnFactory;
    this.executablePath = null;
    this.process = null;
    this.processGeneration = 0;
    this.activeProcessToken = null;
    this.activeProcessReason = null;
    this.processHistory = [];
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
    this.stdoutBuffer = "";
    this.stderrBuffer = "";
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

  start(inputPath, args, diagnostics = {}) {
    const generation = this.processGeneration + 1;
    const processToken = `ffmpeg-${generation}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.processGeneration = generation;

    if (this.dryRun) {
      this.activeProcessToken = processToken;
      this.logger.info("ffmpeg", "FFmpeg dry-run iniciado.", { inputPath, processGeneration: generation, processToken });
      const stream = new PassThrough();
      Readable.from([Buffer.from("bar-radio-dry-run-audio")]).pipe(stream);
      this.process = null;
      return { stream, process: null, processGeneration: generation, processToken };
    }

    this.ensureAvailable();
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Audio file not found: ${inputPath}`);
    }

    this.command = [this.executablePath, ...args].join(" ");
    this.sanitizedCommand = [this.executablePath, ...sanitizeArgs(args)].join(" ");
    const startedAt = new Date().toISOString();
    this.startedAt = startedAt;
    this.exitedAt = null;
    this.exitCode = null;
    this.signal = null;
    this.lastError = null;
    this.lastStdout = "";
    this.lastStderr = "";
    this.stdoutBuffer = "";
    this.stderrBuffer = "";
    this.activeProcessToken = processToken;
    this.activeProcessReason = "streaming";

    const spawnDiagnostics = {
      command: this.sanitizedCommand,
      outputUrl: sanitizeText(diagnostics.outputUrl),
      mount: diagnostics.mount,
      protocol: diagnostics.protocol,
      host: diagnostics.host,
      port: diagnostics.port,
      username: diagnostics.username,
      authMethod: diagnostics.authMethod,
      usesPasswordOption: Boolean(diagnostics.usesPasswordOption),
    };
    this.logger.info("ffmpeg", "FFmpeg spawn diagnostics.", spawnDiagnostics);
    if (this.config.logLevel === "debug") {
      console.info("[stream:debug] FFmpeg spawn diagnostics");
      console.info(JSON.stringify(spawnDiagnostics, null, 2));
    }

    const processRef = this.spawnFactory(this.executablePath, args, {
      cwd: path.dirname(inputPath),
      windowsHide: true,
    });
    const processPid = processRef.pid || null;
    const processState = {
      processGeneration: generation,
      processToken,
      processPid,
      inputPath,
      startedAt,
      exitedAt: null,
      exitCode: null,
      signal: null,
      stdoutBuffer: "",
      stderrBuffer: "",
      reason: "streaming",
    };
    this.process = processRef;
    this.pid = processPid;

    this.logger.info("ffmpeg", "FFmpeg iniciado.", {
      executablePath: this.executablePath,
      pid: processPid,
      processGeneration: generation,
      processToken,
      command: this.sanitizedCommand,
      args: sanitizeArgs(args),
    });

    processRef.stdout.on("data", (chunk) => {
      processState.stdoutBuffer += chunk.toString();
      const output = chunk.toString().trim();
      if (this.isCurrentProcess(processRef, generation)) {
        this.stdoutBuffer = processState.stdoutBuffer;
        this.lastStdout = output;
      }
      if (output) {
        this.logger.info("ffmpeg", "FFmpeg stdout.", {
          pid: processPid,
          processGeneration: generation,
          processToken,
          currentProcess: this.isCurrentProcess(processRef, generation),
          output,
        });
        if (this.config.logLevel === "debug") console.info(`[stream:debug] FFmpeg stdout: ${this.lastStdout}`);
      }
    });

    processRef.stderr.on("data", (chunk) => {
      processState.stderrBuffer += chunk.toString();
      const output = chunk.toString().trim();
      if (this.isCurrentProcess(processRef, generation)) {
        this.stderrBuffer = processState.stderrBuffer;
        this.lastStderr = output;
      }
      if (output) {
        this.logger.info("ffmpeg", "FFmpeg stderr.", {
          pid: processPid,
          processGeneration: generation,
          processToken,
          currentProcess: this.isCurrentProcess(processRef, generation),
          output,
        });
        if (this.config.logLevel === "debug") console.error(`[stream:debug] FFmpeg stderr: ${this.lastStderr}`);
      }
    });

    processRef.on("exit", (code, signal) => {
      const exitedAt = new Date().toISOString();
      const currentProcess = this.isCurrentProcess(processRef, generation);
      processState.exitedAt = exitedAt;
      processState.exitCode = code;
      processState.signal = signal;
      processState.reason = processRef.__barRadioStopReason || (code === 0 ? "natural_end" : "process_exit");
      this.recordProcessHistory(processState);

      if (currentProcess) {
        this.exitCode = code;
        this.signal = signal;
        this.exitedAt = exitedAt;
        this.stdoutBuffer = processState.stdoutBuffer;
        this.stderrBuffer = processState.stderrBuffer;
        this.lastStdout = processState.stdoutBuffer.trim().split(/\r?\n/).filter(Boolean).at(-1) || "";
        this.lastStderr = processState.stderrBuffer.trim().split(/\r?\n/).filter(Boolean).at(-1) || "";
      }

      this.logger.info("ffmpeg", "FFmpeg finalizado.", {
        pid: processPid,
        processGeneration: generation,
        processToken,
        exitCode: code,
        signal,
        startedAt,
        exitedAt,
        reason: processState.reason,
        activeProcessAtExit: this.pid,
        currentProcess,
        stderr: processState.stderrBuffer,
      });
      if (this.config.logLevel === "debug") {
        console.info("[stream:debug] FFmpeg exit");
        console.info(JSON.stringify({
          pid: processPid,
          processGeneration: generation,
          processToken,
          exitCode: code,
          signal,
          stderr: processState.stderrBuffer,
          currentProcess,
        }, null, 2));
      }
    });

    processRef.on("error", (error) => {
      const exitedAt = new Date().toISOString();
      const currentProcess = this.isCurrentProcess(processRef, generation);
      processState.exitedAt = exitedAt;
      processState.reason = "spawn_error";
      this.recordProcessHistory(processState);
      if (currentProcess) {
        this.lastError = error.message;
        this.exitedAt = exitedAt;
      }
      this.logger.error("ffmpeg", "Falha ao iniciar FFmpeg.", {
        pid: processPid,
        processGeneration: generation,
        processToken,
        command: this.sanitizedCommand,
        currentProcess,
        error: error.message,
      });
    });

    return {
      stream: processRef.stdout,
      process: processRef,
      processGeneration: generation,
      processToken,
      processPid,
      startedAt,
    };
  }

  isCurrentProcess(processRef, generation) {
    return Boolean(this.process === processRef && this.processGeneration === generation);
  }

  recordProcessHistory(processState) {
    this.processHistory.unshift({
      processGeneration: processState.processGeneration,
      processToken: processState.processToken,
      pid: processState.processPid,
      startedAt: processState.startedAt,
      exitedAt: processState.exitedAt,
      exitCode: processState.exitCode,
      signal: processState.signal,
      reason: processState.reason,
    });
    this.processHistory = this.processHistory.slice(0, 20);
  }

  stop(processRef = this.process, { reason = "manual_stop", processGeneration = this.processGeneration } = {}) {
    if (!processRef) return false;
    const currentProcess = this.isCurrentProcess(processRef, processGeneration);
    if (processRef && !processRef.killed) {
      processRef.__barRadioStopReason = reason;
      this.logger.info("ffmpeg", "FFmpeg stop solicitado.", {
        pid: processRef.pid || null,
        processGeneration,
        reason,
        currentProcess,
      });
      processRef.kill("SIGTERM");
    }
    if (currentProcess) {
      this.activeProcessReason = reason;
      this.process = null;
    }
    return currentProcess;
  }

  status() {
    const running = Boolean(this.process && !this.process.killed && this.process.exitCode === null);
    return {
      executablePath: this.executablePath,
      pid: this.pid,
      command: this.sanitizedCommand,
      running,
      status: running ? "RUNNING" : "OFFLINE",
      processGeneration: this.processGeneration,
      processToken: this.activeProcessToken,
      activeProcessReason: this.activeProcessReason,
      dryRun: this.dryRun,
      startedAt: this.startedAt,
      exitedAt: this.exitedAt,
      exitCode: this.exitCode,
      signal: this.signal,
      lastStdout: this.lastStdout,
      lastStderr: this.lastStderr,
      stdout: this.stdoutBuffer,
      stderr: this.stderrBuffer,
      lastError: this.lastError,
      processHistory: this.processHistory,
    };
  }
}
