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
        const args = directToIcecast
          ? this.encoder.getIcecastFFmpegArgs(track.path, this.icecast.getSourceUrl(), this.icecast.config)
          : this.encoder.getFFmpegArgs(track.path);
        const icecastStream = directToIcecast
          ? null
          : this.icecast.connect();
        if (directToIcecast) {
          this.icecast.prepareForExternalSource();
        }
        const { stream, process } = this.ffmpeg.start(track.path, args);
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
          pid: process?.pid || null,
        });

        const finish = () => {
          if (settled) return;
          settled = true;
          this.setState(AUDIO_PIPELINE_STATES.FINISHED, { trackId: track.id });
          resolve();
        };

        const fail = (error) => {
          if (settled) return;
          settled = true;
          this.lastError = error.message;
          this.setState(AUDIO_PIPELINE_STATES.OFFLINE, { trackId: track.id, error: error.message });
          this.ffmpeg.stop();
          reject(error);
        };

        stream?.on("end", finish);
        stream?.on("error", fail);
        icecastStream?.on?.("error", fail);
        process?.on("exit", (code) => {
          if (code && code !== 0) {
            fail(new Error(`FFmpeg exited with code ${code}`));
            return;
          }
          finish();
        });
        process?.on("error", fail);

        this.icecast.waitForMount({ timeoutMs: this.icecast.config.timeout || 10000 })
          .then((icecastStatus) => {
            if (settled) return;
            if (!icecastStatus.mountActive) {
              fail(new Error("Icecast mount /radio was not confirmed."));
              return;
            }
            this.setState(AUDIO_PIPELINE_STATES.STREAMING, {
              trackId: track.id,
              title: track.title,
              pid: process?.pid || null,
            });
            this.logger.info("stream", "Audio pipeline iniciado.", {
              trackId: track.id,
              title: track.title,
              pid: process?.pid || null,
              mount: this.icecast.config.mount,
            });
          })
          .catch(fail);

        if (!process) {
          this.setState(AUDIO_PIPELINE_STATES.STREAMING, { trackId: track.id, dryRun: true });
          finish();
        }
      } catch (error) {
        this.lastError = error.message;
        this.setState(AUDIO_PIPELINE_STATES.OFFLINE, { trackId: track.id, error: error.message });
        reject(error);
      }
    });
  }

  stop() {
    this.ffmpeg.stop();
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
