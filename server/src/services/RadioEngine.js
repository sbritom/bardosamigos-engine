import { AutoDJService } from "./AutoDJService.js";
import { ConfigService } from "./ConfigService.js";
import { LibraryService } from "./LibraryService.js";
import { ListenerService } from "./ListenerService.js";
import { LoggerService } from "./LoggerService.js";
import { NowPlayingService } from "./NowPlayingService.js";
import { PlaylistService } from "./PlaylistService.js";
import { ScheduleService } from "./ScheduleService.js";
import { StatsService } from "./StatsService.js";
import { StreamingService } from "./StreamingService.js";

export const RadioEngine = {
  getStatus() {
    return {
      ...StreamingService.getStatus(),
      autoDjStatus: AutoDJService.getStatus(),
    };
  },
  getNowPlaying: NowPlayingService.getNowPlaying,
  getHistory: NowPlayingService.getHistory,
  listPlaylists: PlaylistService.listPlaylists,
  listCategories: LibraryService.listCategories,
  listLibrary: LibraryService.listTracks,
  getConfig: ConfigService.getConfig,
  listListeners: ListenerService.listListeners,
  getStats: StatsService.getStats,
  listLogs: LoggerService.listLogs,
  listSchedule: ScheduleService.listSchedule,
};
