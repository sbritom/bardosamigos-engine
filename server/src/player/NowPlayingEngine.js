export class NowPlayingEngine {
  constructor(eventBus) {
    this.nowPlaying = null;
    this.eventBus = eventBus;
    this.listeners = 0;
    this.bitrate = null;
    this.streamState = "Idle";
  }

  init() {
    this.eventBus.on("musicStarted", ({ track }) => this.start(track));
    this.eventBus.on("musicFinished", () => this.finish());
    this.eventBus.on("streamStarted", ({ bitrate, state } = {}) => this.updateStream({ bitrate, state: state || "Streaming" }));
    this.eventBus.on("streamStopped", () => this.updateStream({ state: "Idle" }));
    this.eventBus.on("listenerUpdate", ({ listeners } = {}) => {
      this.listeners = Number(listeners || 0);
    });
  }

  start(track) {
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + Number(track?.duration || 0) * 1000);
    this.nowPlaying = {
      title: track?.title || "",
      artist: track?.artist || "",
      album: track?.album || "",
      category: track?.category || track?.genre || "",
      id: track?.id || null,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      elapsed: 0,
      remainingSeconds: track?.duration || 0,
      remaining: track?.duration || 0,
      listeners: this.listeners,
      bitrate: this.bitrate,
      streamState: this.streamState,
      track,
    };
    this.eventBus.emit("nowPlayingUpdated", this.nowPlaying);
    return this.nowPlaying;
  }

  finish() {
    if (this.nowPlaying) {
      this.nowPlaying = {
        ...this.nowPlaying,
        remainingSeconds: 0,
        remaining: 0,
        streamState: "Finished",
      };
    }
  }

  get() {
    if (!this.nowPlaying) return null;
    const remainingSeconds = Math.max(0, Math.floor((new Date(this.nowPlaying.endsAt).getTime() - Date.now()) / 1000));
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(this.nowPlaying.startedAt).getTime()) / 1000));
    return {
      ...this.nowPlaying,
      elapsed,
      remaining: remainingSeconds,
      remainingSeconds,
      listeners: this.listeners,
      bitrate: this.bitrate,
      streamState: this.streamState,
    };
  }

  updateStream({ bitrate = this.bitrate, state = this.streamState } = {}) {
    this.bitrate = bitrate;
    this.streamState = state;
    if (this.nowPlaying) {
      this.nowPlaying = {
        ...this.nowPlaying,
        bitrate,
        streamState: state,
      };
    }
  }
}
