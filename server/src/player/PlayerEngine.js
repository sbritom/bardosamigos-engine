export const PLAYER_STATES = Object.freeze({
  STOPPED: "STOPPED",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  BUFFERING: "BUFFERING",
  LOADING: "LOADING",
  ERROR: "ERROR",
});

export class PlayerEngine {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = PLAYER_STATES.STOPPED;
    this.currentTrack = null;
  }

  setState(state, payload = {}) {
    this.state = state;
    this.eventBus.emit("playerStateChanged", { state, ...payload });
    return this.state;
  }

  load(track) {
    this.currentTrack = track;
    return this.setState(PLAYER_STATES.LOADING, { track });
  }

  play(track = this.currentTrack) {
    this.currentTrack = track;
    this.eventBus.emit("musicStarted", { track });
    return this.setState(PLAYER_STATES.PLAYING, { track });
  }

  pause() {
    return this.setState(PLAYER_STATES.PAUSED);
  }

  stop() {
    this.eventBus.emit("musicFinished", { track: this.currentTrack });
    this.currentTrack = null;
    return this.setState(PLAYER_STATES.STOPPED);
  }

  error(error) {
    return this.setState(PLAYER_STATES.ERROR, { error: error?.message || String(error) });
  }
}
