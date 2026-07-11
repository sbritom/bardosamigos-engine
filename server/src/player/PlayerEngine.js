import { PLAYER_EVENTS } from "./PlayerEvents.js";
import { PlayerState } from "./PlayerState.js";

export const PLAYER_STATES = Object.freeze({
  STOPPED: "STOPPED",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  BUFFERING: "BUFFERING",
  LOADING: "LOADING",
  ERROR: "ERROR",
});

export class PlayerEngine {
  constructor(eventBus, services = {}) {
    this.eventBus = eventBus;
    this.state = PLAYER_STATES.STOPPED;
    this.currentTrack = null;
    this.services = services;
    this.playerState = new PlayerState({ volume: Number(services.volume ?? 1) });
    this.lastTrackId = null;
    this.ready = false;
  }

  configure(services = {}) {
    this.services = { ...this.services, ...services };
    this.ready = true;
    this.bindEvents();
    this.services.logger?.info("engine", "Player initialized.");
    this.eventBus?.emit(PLAYER_EVENTS.READY, this.getState());
    return this.getState();
  }

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;
    ["nowPlayingUpdated", "musicStarted", "musicFinished", "streamStarted", "streamStopped", "historyUpdated"].forEach((eventName) => {
      this.eventBus?.on(eventName, () => this.synchronize());
    });
  }

  setState(state, payload = {}) {
    this.state = state;
    this.eventBus?.emit("playerStateChanged", { state, ...payload });
    return this.state;
  }

  load(track) {
    this.currentTrack = track;
    return this.setState(PLAYER_STATES.LOADING, { track });
  }

  play(track = this.currentTrack) {
    this.currentTrack = track;
    this.eventBus?.emit("musicStarted", { track });
    return this.setState(PLAYER_STATES.PLAYING, { track });
  }

  pause() {
    return this.setState(PLAYER_STATES.PAUSED);
  }

  stop() {
    this.eventBus?.emit("musicFinished", { track: this.currentTrack });
    this.currentTrack = null;
    return this.setState(PLAYER_STATES.STOPPED);
  }

  error(error) {
    return this.setState(PLAYER_STATES.ERROR, { error: error?.message || String(error) });
  }

  synchronize() {
    const nowPlaying = this.services.nowPlaying?.get?.();
    const streamStatus = this.services.stream?.status?.();
    const nextTrack = this.services.audioQueue?.peek?.() || this.services.playlist?.peek?.() || null;
    const previousTrack = this.services.history?.previous?.() || null;
    const status = this.resolveStatus(nowPlaying, streamStatus);
    const state = this.playerState.update({
      nowPlaying,
      previousTrack,
      nextTrack,
      status,
    });

    if (state.currentTrack?.id && state.currentTrack.id !== this.lastTrackId) {
      this.lastTrackId = state.currentTrack.id;
      this.services.logger?.info("engine", "Track changed.", { trackId: state.currentTrack.id });
      this.eventBus?.emit(PLAYER_EVENTS.TRACK_CHANGED, state);
    }

    this.services.logger?.info("engine", "Player synchronized.", { status: state.status });
    this.services.logger?.info("engine", "Now Playing updated.", { trackId: state.currentTrack?.id || null });
    this.eventBus?.emit(PLAYER_EVENTS.UPDATED, state);
    return state;
  }

  resolveStatus(nowPlaying, streamStatus) {
    if (streamStatus?.running || nowPlaying?.streamState === "Streaming") return "live";
    if (nowPlaying) return String(nowPlaying.streamState || "ready").toLowerCase();
    return "offline";
  }

  getState() {
    return this.synchronize();
  }

  getHistory() {
    return this.services.history?.list?.() || [];
  }

  setVolume(volume) {
    const state = this.playerState.setVolume(volume);
    this.services.logger?.info("engine", "Player volume changed.", { volume: state.volume });
    this.eventBus?.emit(PLAYER_EVENTS.VOLUME_CHANGED, state);
    this.eventBus?.emit(PLAYER_EVENTS.UPDATED, state);
    return state;
  }
}
