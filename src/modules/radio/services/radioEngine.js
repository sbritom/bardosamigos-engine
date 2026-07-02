import { radioApi } from "../api";
import { radioApiConfig } from "../config";
import { radioInitialState } from "../store/radioMocks";
import { ConfigService } from "./configService";
import { ListenerService } from "./listenerService";
import { LoggerService } from "./loggerService";
import { MetadataService } from "./metadataService";
import { PlaylistService } from "./playlistService";
import { ScheduleService } from "./scheduleService";
import { StreamingService } from "./streamService";

export const RadioEngine = {
  async loadInitialState() {
    const [status, nowPlaying, history, tracks, categories, playlists, schedule, listeners, stats, logs, config, stream, audio, icecast] =
      await Promise.all([
        StreamingService.getStatus(),
        MetadataService.getNowPlaying(),
        MetadataService.getHistory(),
        radioApi.listTracks(),
        radioApi.listCategories(),
        PlaylistService.listPlaylists(),
        ScheduleService.listWeeklySchedule(),
        ListenerService.getRealtimeListeners(),
        radioApi.getStats(),
        LoggerService.listLogs(),
        ConfigService.getConfig(),
        radioApi.getStream(),
        radioApi.getAudio(),
        radioApi.getIcecast(),
      ]);

    const currentTrack = normalizeTrack(nowPlaying.data?.current || nowPlaying.data?.track);
    const nextTrack = normalizeTrack(nowPlaying.data?.next || audio.data?.next);
    const historyTracks = (history.data || nowPlaying.data?.history || []).map(normalizeTrack).filter(Boolean);
    const libraryTracks = (tracks.data || radioInitialState.tracks).map(normalizeTrack).filter(Boolean);
    const tracksById = mergeTracks(libraryTracks, [currentTrack, nextTrack, ...historyTracks]);
    const engineConfig = normalizeConfig(config.data, stream.data);
    const engineStatus = normalizeStatus(status.data, stream.data, icecast.data, nowPlaying.data, tracksById);

    const nextState = {
      ...radioInitialState,
      status: { ...radioInitialState.status, ...engineStatus },
      config: { ...radioInitialState.config, ...engineConfig },
      tracks: tracksById.length ? tracksById : radioInitialState.tracks,
      categories: categories.data || radioInitialState.categories,
      playlists: playlists.data || radioInitialState.playlists,
      schedule: schedule.data || radioInitialState.schedule,
      listeners: listeners.data || radioInitialState.listeners,
      logs: logs.data || radioInitialState.logs,
      stats: stats.data || null,
      api: {
        fallback:
          status.fallback ||
          nowPlaying.fallback ||
          tracks.fallback ||
          config.fallback ||
          stream.fallback ||
          icecast.fallback,
        error:
          status.error ||
          nowPlaying.error ||
          tracks.error ||
          config.error ||
          stream.error ||
          icecast.error ||
          null,
      },
    };

    if (currentTrack?.id) {
      nextState.status.currentTrackId = currentTrack.id;
    }

    if (nextTrack?.id) {
      nextState.status.nextTrackId = nextTrack.id;
    }

    return nextState;
  },
};

function normalizeTrack(track) {
  if (!track) return null;
  return {
    id: track.id || track.hash || track.path || `track-${track.title}-${track.artist}`,
    title: track.title || "Programacao ao vivo",
    artist: track.artist || "Radio Bar dos Amigos",
    album: track.album || "",
    category: track.category || track.genre || "",
    year: track.year || null,
    bitrate: track.bitrate || "",
    format: track.format || track.extension || track.codec || "",
    size: track.size ? `${Math.round(Number(track.size) / 1024 / 1024)} MB` : "",
    duration: Number(track.duration || track.remainingSeconds || 0),
    uploadedAt: track.uploadedAt || track.playedAt || track.startedAt || "",
    favorite: Boolean(track.favorite),
    cover: track.cover || track.image || "",
    path: track.path || "",
  };
}

function mergeTracks(...trackGroups) {
  const map = new Map();
  trackGroups.flat().filter(Boolean).forEach((track) => {
    map.set(track.id, { ...map.get(track.id), ...track });
  });
  return Array.from(map.values());
}

function normalizeConfig(config = {}, stream = {}) {
  return {
    name: config.radioName || config.name || radioInitialState.config.name,
    slogan: config.radioSlogan || config.slogan || radioInitialState.config.slogan,
    streamUrl:
      radioApiConfig.streamUrl ||
      config.streamUrl ||
      config.stream?.publicUrl ||
      config.stream?.streamUrl ||
      "",
    statusUrl: radioApiConfig.statusUrl || config.statusUrl || config.stream?.statusUrl || "",
    streamingType: config.stream?.protocol || config.streamingType || "external",
    mountpoint: config.stream?.mount || config.mountpoint || "",
    port: config.stream?.port || config.port || "",
    codec: config.audio?.codec || config.codec || "",
    bitrate: config.audio?.bitrate || config.bitrate || "",
    format: config.audio?.format || config.format || "",
    autoReconnect: config.stream?.reconnect ?? config.autoReconnect ?? true,
    autoplay: config.autoplay ?? false,
    defaultVolume: config.defaultVolume || radioInitialState.config.defaultVolume,
    primaryColor: config.primaryColor || radioInitialState.config.primaryColor,
    secondaryColor: config.secondaryColor || radioInitialState.config.secondaryColor,
    theme: config.theme || radioInitialState.config.theme,
    language: config.language || radioInitialState.config.language,
    streamStatus: stream,
  };
}

function normalizeStatus(status = {}, stream = {}, icecast = {}, nowPlaying = {}, tracks = []) {
  const currentId = nowPlaying.current?.id || nowPlaying.track?.id || status.nowPlaying?.id || status.currentTrackId;
  const nextId = nowPlaying.next?.id || stream.nextTrack?.id || status.nextTrackId;
  return {
    online: Boolean(stream.running || status.streaming || icecast.connected),
    autoDj: Boolean(status.autoDJReady ?? status.autoDj),
    streaming: Boolean(stream.running || status.streaming),
    currentTrackId: currentId || tracks[0]?.id || null,
    nextTrackId: nextId || tracks[1]?.id || null,
    remainingSeconds: Number(nowPlaying.remainingSeconds || status.remainingSeconds || 0),
    listenersOnline: Number(status.listenersOnline || status.listeners?.online || 0),
    audiencePeak: Number(status.audiencePeak || status.listeners?.peak || 0),
    storageUsedGb: Number(status.storageUsedGb || 0),
    storageTotalGb: Number(status.storageTotalGb || 15),
    lastUploadAt: status.lastUploadAt || tracks[0]?.uploadedAt || "",
    lastError: status.lastError || "",
    engineState: status.state || "",
    icecast,
    stream,
  };
}
