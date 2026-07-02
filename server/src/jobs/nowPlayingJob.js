import { LoggerService } from "../services/LoggerService.js";

export function startNowPlayingJob() {
  LoggerService.log("job", "info", "Now Playing job preparado. Polling real entra na Sprint 3.");
  return () => {};
}
