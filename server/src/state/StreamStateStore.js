export class StreamStateStore {
  constructor() {
    this.state = {
      currentTrack: null,
      elapsed: 0,
      remaining: 0,
      listeners: 0,
      bitrate: null,
      streamState: "Idle",
      updatedAt: null,
    };
  }

  update(nextState = {}) {
    this.state = {
      ...this.state,
      ...nextState,
      updatedAt: new Date().toISOString(),
    };
    return this.get();
  }

  get() {
    return { ...this.state };
  }

  reset() {
    return this.update({
      currentTrack: null,
      elapsed: 0,
      remaining: 0,
      streamState: "Idle",
    });
  }
}
