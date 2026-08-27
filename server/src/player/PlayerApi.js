import { NowPlayingService } from "./NowPlayingService.js";

export class PlayerApi {
  constructor(playerEngine) {
    this.service = new NowPlayingService({ playerEngine });
  }

  state() {
    return this.service.getState();
  }

  nowPlaying() {
    return this.service.getNowPlaying();
  }

  history() {
    return this.service.getHistory();
  }

  next() {
    return this.service.getNext();
  }

  status() {
    return this.service.getStatus();
  }
}
