import { AutoDJEngine } from "../autodj/AutoDJEngine.js";
import { ApiEngine } from "../api/ApiEngine.js";
import { AudioPipeline } from "../audio/AudioPipeline.js";
import { QueueEngine } from "../queue/QueueEngine.js";
import { Encoder } from "../audio/Encoder.js";
import { ConfigEngine } from "../config/ConfigEngine.js";
import { EventBus } from "../events/EventBus.js";
import { FFmpegEngine } from "../ffmpeg/FFmpegEngine.js";
import { HistoryEngine } from "../history/HistoryEngine.js";
import { IcecastClient } from "../icecast/IcecastClient.js";
import { LibraryEngine } from "../library/LibraryEngine.js";
import { PlaylistEngine } from "../library/PlaylistEngine.js";
import { LoggerEngine } from "../logger/LoggerEngine.js";
import { NowPlayingEngine } from "../player/NowPlayingEngine.js";
import { PlayerEngine } from "../player/PlayerEngine.js";
import { SchedulerEngine } from "../scheduler/SchedulerEngine.js";
import { StreamEngine } from "../stream/StreamEngine.js";
import { StreamStateStore } from "../state/StreamStateStore.js";

export class RadioEngine {
  constructor({ env = process.env } = {}) {
    this.env = env;
    this.state = "CREATED";
    this.config = null;
    this.events = new EventBus();
    this.heartbeatTimer = null;
  }

  async start() {
    this.config = new ConfigEngine(this.env).load();

    this.logger = new LoggerEngine(this.config);
    this.logger.init();
    this.logger.info("startup", "Startup iniciado.");
    if (this.config.libraryPathFound) {
      console.info("Library path detected:");
      console.info(this.config.libraryPath);
      this.logger.info("library", `Library path detected: ${this.config.libraryPath}`, {
        path: this.config.libraryPath,
      });
    } else {
      console.warn("Library not found.");
      this.logger.warn("library", "Library not found.", {
        candidates: this.config.libraryPathCandidates,
      });
    }
    this.streamState = new StreamStateStore();

    this.library = new LibraryEngine(this.config, this.logger);
    this.library.init();
    this.events.emit("libraryLoaded", { tracks: this.library.list().length });

    this.playlist = new PlaylistEngine(this.library, this.config);
    this.playlist.init();
    this.events.emit("playlistChanged", { tracks: this.playlist.tracks.length });

    this.scheduler = new SchedulerEngine(this.logger);
    this.scheduler.init();

    this.history = new HistoryEngine(this.config.historyLimit, this.logger, this.events);
    this.history.init(this.events);

    this.player = new PlayerEngine(this.events);

    this.nowPlaying = new NowPlayingEngine(this.events);
    this.nowPlaying.init();

    this.autodj = new AutoDJEngine(this.playlist, this.logger, this.events, this.nowPlaying, this.history);
    this.autodj.init();

    this.audioQueue = new QueueEngine();
    this.encoder = new Encoder(this.config.audio);
    this.ffmpeg = new FFmpegEngine(this.config, this.logger);
    this.ffmpeg.detect();
    this.icecast = new IcecastClient(this.config, this.logger);
    this.audioPipeline = new AudioPipeline({
      encoder: this.encoder,
      ffmpeg: this.ffmpeg,
      icecast: this.icecast,
      logger: this.logger,
    });
    this.stream = new StreamEngine({
      audioQueue: this.audioQueue,
      audioPipeline: this.audioPipeline,
      autodj: this.autodj,
      history: this.history,
      nowPlaying: this.nowPlaying,
      logger: this.logger,
      eventBus: this.events,
    });

    this.api = new ApiEngine(this, this.logger);
    await this.api.init();

    this.state = "READY";
    this.events.emit("engineStarted", this.getStatus());
    this.startHeartbeat();
    this.logger.info("engine", "Sistema pronto. Aguardando Streaming.");

    if (this.config.streamOnStart) {
      if (this.env.RADIO_EXIT_AFTER_START === "true") {
        await this.startStreaming({ once: true });
      } else {
        this.startStreaming().catch((error) => {
          this.logger.error("engine", "Falha ao iniciar streaming automatico.", { error: error.message });
        });
      }
    }

    return this.getStatus();
  }

  async startStreaming(options = {}) {
    return this.stream.start(options);
  }

  async stop() {
    this.state = "STOPPED";
    clearInterval(this.heartbeatTimer);
    this.stream?.stop();
    await this.api?.stop();
    this.library?.closeWatchers();
    this.events.emit("engineStopped");
    this.logger?.info("shutdown", "Shutdown executado.");
    this.logger?.info("engine", "Engine parada.");
  }

  async restart() {
    this.logger?.info("engine", "Restart solicitado.");
    await this.stop();
    this.state = "RESTARTING";
    return this.start();
  }

  healthCheck() {
    const status = this.getStatus();
    return {
      ok: this.state === "READY",
      state: this.state,
      api: Boolean(this.api?.server),
      library: status.librarySize,
      stream: status.stream,
      checkedAt: new Date().toISOString(),
    };
  }

  startHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.events.emit("heartbeat", this.healthCheck());
      this.logger?.info("engine", "Heartbeat.", { state: this.state });
    }, 30000);
    this.heartbeatTimer.unref?.();
  }

  getStatus() {
    const streamStatus = this.stream?.status();
    this.streamState?.update({
      currentTrack: streamStatus?.currentTrack || null,
      bitrate: this.config?.audio?.bitrate || null,
      streamState: streamStatus?.pipeline?.state || "Idle",
      libraryPath: this.config?.libraryPath || this.config?.musicFolder || null,
      libraryPathFound: Boolean(this.config?.libraryPathFound),
    });

    return {
      state: this.state,
      radioName: this.config?.radioName,
      libraryPath: this.config?.libraryPath || this.config?.musicFolder,
      libraryPathFound: Boolean(this.config?.libraryPathFound),
      librarySize: this.library?.list().length || 0,
      playlistSize: this.playlist?.tracks.length || 0,
      queueSize: this.getQueueSize(),
      schedulerActive: Boolean(this.scheduler?.active),
      autoDJReady: Boolean(this.autodj?.active),
      nowPlaying: this.nowPlaying?.get(),
      globalNowPlaying: this.streamState?.get(),
      historySize: this.history?.list().length || 0,
      stream: streamStatus,
      ffmpeg: this.ffmpeg?.status(),
      icecast: this.icecast?.status(),
      apiPort: this.config?.apiPort,
      waitingForStreaming: !this.stream?.status().running,
    };
  }

  getQueueSize() {
    const playlistQueue = this.playlist?.queueList().length || 0;
    const audioQueue = this.audioQueue?.list().length || 0;
    const preloaded = this.audioQueue?.peek() ? 1 : 0;
    return playlistQueue + audioQueue + preloaded;
  }
}
