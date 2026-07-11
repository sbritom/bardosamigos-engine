export const AUDIO_PIPELINE_STATES = {
  IDLE: "Idle",
  LOADING: "Loading",
  BUFFERING: "Buffering",
  STREAMING: "Streaming",
  FINISHED: "Finished",
  OFFLINE: "Offline",
  ERROR: "Error",
};

export class AudioPipeline {
  constructor({ encoder, ffmpeg, icecast, logger }) {
    this.encoder = encoder;
    this.ffmpeg = ffmpeg;
    this.icecast = icecast;
    this.logger = logger;
    this.currentProcess = null;
    this.currentTrack = null;
    this.state = AUDIO_PIPELINE_STATES.IDLE;
    this.lastError = null;
  }

  async play(track) {
    if (!track?.path) {
      throw new Error("Track path is required for streaming.");
    }

    this.currentTrack = track;
    this.lastError = null;
    this.setState(AUDIO_PIPELINE_STATES.LOADING, { trackId: track.id, title: track.title });

    return new Promise((resolve, reject) => {
      try {
        const directToIcecast = Boolean(this.encoder.getIcecastFFmpegArgs && this.icecast.getSourceUrl);
        const outputUrl = directToIcecast ? this.icecast.getSourceUrl() : null;
        const args = directToIcecast
          ? this.encoder.getIcecastFFmpegArgs(track.path, outputUrl)
          : this.encoder.getFFmpegArgs(track.path);
        const icecastStream = directToIcecast
          ? null
          : this.icecast.connect();
        if (directToIcecast) {
          this.icecast.prepareForExternalSource();
        }
        const ffmpegRun = this.ffmpeg.start(track.path, args, {
          outputUrl,
          mount: this.icecast.config.mount,
          protocol: this.icecast.config.protocol,
          host: this.icecast.config.host,
          port: this.icecast.config.port,
          username: this.icecast.config.username,
          authMethod: directToIcecast ? "urlCredentials" : "sourceRequest",
          usesPasswordOption: args.includes("-password"),
        });
        const { stream, process, processGeneration, processToken, processPid, startedAt } = ffmpegRun;
        let settled = false;
        this.currentProcess = process;

        this.setState(AUDIO_PIPELINE_STATES.BUFFERING, { trackId: track.id });
        if (icecastStream) {
          stream.pipe(icecastStream, { end: false });
        }
        this.icecast.updateMetadata(track);
        if (!process && !this.ffmpeg.status().dryRun) {
          throw new Error("FFmpeg process was not created.");
        }
        this.logger.info("stream", "Audio pipeline aguardando mount Icecast.", {
          trackId: track.id,
          title: track.title,
          pid: processPid || process?.pid || null,
          processGeneration,
          processToken,
          startedAt,
        });

        const finish = (reason = "natural_end") => {
          if (settled) return;
          settled = true;
          this.setState(AUDIO_PIPELINE_STATES.FINISHED, {
            trackId: track.id,
            processGeneration,
            processToken,
            reason,
          });
          resolve();
        };

        const fail = (error, reason = "process_error") => {
          if (settled) return;
          settled = true;
          this.lastError = error.message;
          this.setState(AUDIO_PIPELINE_STATES.OFFLINE, {
            trackId: track.id,
            processGeneration,
            processToken,
            reason,
            error: error.message,
          });
          this.ffmpeg.stop(process, { reason, processGeneration });
          reject(error);
        };

        if (!directToIcecast) {
          stream?.on("end", () => finish("stdout_end"));
        }
        stream?.on("error", (error) => fail(error, "stdout_error"));
        icecastStream?.on?.("error", (error) => fail(error, "icecast_stream_error"));
        process?.on("exit", (code) => {
          if (code && code !== 0) {
            fail(new Error(`FFmpeg exited with code ${code}`), "process_exit_error");
            return;
          }
          finish("natural_end");
        });
        process?.on("error", (error) => fail(error, "spawn_error"));

        this.icecast.waitForMount({
          timeoutMs: 15000,
          intervalMs: 500,
          getFfmpegStatus: () => this.ffmpeg.status(),
        })
          .then((icecastStatus) => {
            if (settled) return;
            if (!icecastStatus.mountActive) {
              this.logger.error("icecast", "Mount Icecast nao confirmado apos spawn FFmpeg.", {
                mount: this.icecast.config.mount,
                status: icecastStatus,
              });
              if (this.logger.config?.logLevel === "debug") {
                console.error("[stream:debug] Icecast mount not confirmed");
                console.error(JSON.stringify(icecastStatus, null, 2));
              }
              fail(new Error("Icecast mount /radio was not confirmed."), "mount_not_confirmed");
              return;
            }
            this.setState(AUDIO_PIPELINE_STATES.STREAMING, {
              trackId: track.id,
              title: track.title,
              pid: processPid || process?.pid || null,
              processGeneration,
              processToken,
            });
            this.logger.info("stream", "Audio pipeline iniciado.", {
              trackId: track.id,
              title: track.title,
              pid: processPid || process?.pid || null,
              processGeneration,
              processToken,
              mount: this.icecast.config.mount,
            });
          })
          .catch((error) => fail(error, "mount_check_error"));

        if (!process) {
          this.setState(AUDIO_PIPELINE_STATES.STREAMING, {
            trackId: track.id,
            processGeneration,
            processToken,
            dryRun: true,
          });
          finish("dry_run");
        }
      } catch (error) {
        this.lastError = error.message;
        this.setState(AUDIO_PIPELINE_STATES.OFFLINE, { trackId: track.id, error: error.message });
        reject(error);
      }
    });
  }

  stop() {
    this.ffmpeg.stop(this.currentProcess, { reason: "manual_stop" });
    this.icecast.disconnect();
    this.currentProcess = null;
    this.currentTrack = null;
    this.setState(AUDIO_PIPELINE_STATES.IDLE);
  }

  setState(state, details = {}) {
    this.state = state;
    this.logger.info("stream", "Estado do AudioPipeline atualizado.", { state, ...details });
  }

  status() {
    return {
      state: this.state,
      currentTrack: this.currentTrack,
      lastError: this.lastError,
      ffmpeg: this.ffmpeg.status(),
      icecast: this.icecast.status(),
    };
  }
}
