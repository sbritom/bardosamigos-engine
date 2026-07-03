export class StreamEngine {
  constructor({ audioQueue, audioPipeline, autodj, history, nowPlaying, logger, eventBus, networkDiagnostics = null }) {
    this.audioQueue = audioQueue;
    this.audioPipeline = audioPipeline;
    this.autodj = autodj;
    this.history = history;
    this.nowPlaying = nowPlaying;
    this.logger = logger;
    this.eventBus = eventBus;
    this.networkDiagnostics = networkDiagnostics;
    this.connected = false;
    this.running = false;
    this.currentTrack = null;
    this.lastError = null;
    this.recoveryAttempts = 0;
    this.startedAt = null;
  }

  connect() {
    this.connected = true;
    this.logger.info("stream", "StreamEngine conectado.");
    return this.status();
  }

  disconnect() {
    this.stop();
    this.connected = false;
    this.logger.info("stream", "StreamEngine desconectado.");
    return this.status();
  }

  reconnect() {
    this.disconnect();
    return this.connect();
  }

  async start({ once = false } = {}) {
    if (!this.audioPipeline.ffmpeg.status().dryRun && this.networkDiagnostics) {
      const network = await this.networkDiagnostics.run();
      const target = network.testedHosts.find((item) => item.host === this.audioPipeline.icecast.config.host);
      const reachable = target?.ok || network.icecastReachable;
      if (!reachable) {
        this.lastError = "Icecast indisponivel. Abortando transmissao.";
        this.running = false;
        this.logger.error("stream", this.lastError, { network });
        console.error("Icecast indisponível.");
        console.error("Abortando transmissão.");
        return this.status();
      }
    }

    this.connect();
    this.running = true;
    this.startedAt = new Date().toISOString();
    this.logger.info("stream", "Streaming iniciado.", { once });
    this.eventBus.emit("streamStarted", {
      startedAt: this.startedAt,
      bitrate: this.audioPipeline.encoder.config.bitrate,
      state: "Streaming",
    });

    while (this.running) {
      const played = await this.playNextTrack();
      if (!played || once) {
        this.running = false;
        break;
      }
    }

    return this.status();
  }

  async playNextTrack() {
    const selected = this.selectTrack();

    if (!selected) {
      this.logger.warn("stream", "Nenhuma musica disponivel para transmitir.");
      return false;
    }

    this.currentTrack = selected;
    this.eventBus.emit("musicStarted", { track: selected });
    this.eventBus.emit("trackChanged", { track: selected });
    this.eventBus.emit("metadataChanged", {
      title: selected.title,
      artist: selected.artist,
      album: selected.album,
    });
    this.logger.info("track", "Musica iniciada.", {
      trackId: selected.id,
      artist: selected.artist,
      title: selected.title,
      duration: selected.duration,
    });
    this.audioQueue.preload(this.autodj.selectNext());

    try {
      await this.audioPipeline.play(selected);
      this.recoveryAttempts = 0;
      this.lastError = null;
      this.logger.info("stream", "Musica transmitida.", { trackId: selected.id, title: selected.title });
      this.eventBus.emit("musicFinished", { track: selected });
      return true;
    } catch (error) {
      this.lastError = error.message;
      this.logger.error("stream", "Falha durante transmissao da musica.", {
        trackId: selected.id,
        title: selected.title,
        error: error.message,
      });
      await this.recover(error, selected);
      return this.running;
    }
  }

  selectTrack() {
    const queued = this.audioQueue.next();
    return queued || this.autodj.selectNext();
  }

  async recover(error, track) {
    this.recoveryAttempts += 1;
    this.logger.error("recovery", "Recuperacao de streaming acionada.", {
      attempt: this.recoveryAttempts,
      error: error.message,
      trackId: track?.id,
      title: track?.title,
    });

    this.audioPipeline.stop();

    if (this.recoveryAttempts >= 5) {
      this.running = false;
      this.logger.error("recovery", "Streaming parado apos limite de tentativas de recuperacao.", {
        attempts: this.recoveryAttempts,
      });
      return;
    }

    try {
      this.audioPipeline.icecast.prepareForExternalSource();
    } catch (reconnectError) {
      this.logger.error("recovery", "Falha ao reconectar Icecast.", { error: reconnectError.message });
    }

    await new Promise((resolve) => setTimeout(resolve, Math.min(5000, this.recoveryAttempts * 1000)));
  }

  stop() {
    this.running = false;
    this.audioPipeline.stop();
    this.logger.info("stream", "Streaming parado.");
    this.eventBus.emit("streamStopped", { stoppedAt: new Date().toISOString() });
    return this.status();
  }

  status() {
    return {
      connected: this.connected,
      running: this.running,
      currentTrack: this.currentTrack,
      queueSize: this.audioQueue.list().length,
      nextTrack: this.audioQueue.peek(),
      startedAt: this.startedAt,
      lastError: this.lastError,
      recoveryAttempts: this.recoveryAttempts,
      pipeline: this.audioPipeline.status(),
    };
  }
}
