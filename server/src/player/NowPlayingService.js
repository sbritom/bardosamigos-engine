export class NowPlayingService {
  constructor({ playerEngine } = {}) {
    this.playerEngine = playerEngine;
  }

  getState() {
    return this.playerEngine.getState();
  }

  getNowPlaying() {
    return this.getState().currentTrack;
  }

  getHistory() {
    return this.playerEngine.getHistory();
  }

  getNext() {
    return this.getState().nextTrack;
  }

  getStatus() {
    const state = this.getState();
    return {
      status: state.status,
      listeners: state.listeners,
      volume: state.volume,
      updatedAt: state.updatedAt,
    };
  }
}
