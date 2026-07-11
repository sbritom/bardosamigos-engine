import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import FullPlayer from "./components/FullPlayer";
import HealthCard from "./components/HealthCard";
import HistoryPanel from "./components/HistoryPanel";
import LibraryPanel from "./components/LibraryPanel";
import Loading from "./components/Loading";
import NextTrackPanel from "./components/NextTrackPanel";
import NowPlayingCard from "./components/NowPlayingCard";
import RadioHeader from "./components/RadioHeader";
import RadioStatusCard from "./components/RadioStatusCard";
import StatisticsCard from "./components/StatisticsCard";
import { getStreamUrl, loadRadioDashboard, RADIO_POLLING_INTERVAL } from "./radioApi";
import "./radioUi.css";

const INITIAL_DATA = {
  state: {
    currentTrack: null,
    nextTrack: null,
    elapsed: 0,
    remaining: 0,
    duration: 0,
    listeners: 0,
    status: "offline",
    volume: 0.8,
    cover: null,
    metadata: null,
  },
  status: { online: false, status: "offline", api: "offline" },
  history: [],
  next: null,
  nowPlaying: null,
  health: null,
  error: null,
  updatedAt: null,
};

export default function RadioPage() {
  const audioRef = useRef(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const streamUrl = useMemo(() => getStreamUrl(), []);
  const currentTrack = data.state.currentTrack || data.nowPlaying?.track || data.nowPlaying;
  const nextTrack = data.next?.track || data.next || data.state.nextTrack;
  const online = Boolean(data.status.online || data.state.status === "playing" || data.state.status === "online");

  const refresh = useCallback(async (signal) => {
    try {
      const nextData = await loadRadioDashboard({ signal });
      setData(nextData);
    } catch (error) {
      if (error.name !== "AbortError") {
        setData((current) => ({
          ...current,
          error: "Radio API offline. Interface em modo seguro.",
          status: { ...current.status, online: false, api: "offline" },
          updatedAt: new Date().toISOString(),
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    const intervalId = window.setInterval(() => refresh(controller.signal), RADIO_POLLING_INTERVAL);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  const handleToggle = useCallback(async () => {
    if (!audioRef.current || !streamUrl) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [playing, streamUrl]);

  const handleMute = useCallback(() => {
    setMuted((value) => !value);
  }, []);

  const handleVolume = useCallback((nextVolume) => {
    setVolume(nextVolume);
    setMuted(nextVolume === 0);
  }, []);

  return (
    <div className="bar-radio-page">
      {streamUrl && <audio ref={audioRef} src={streamUrl} preload="none" onEnded={() => setPlaying(false)} />}

      <RadioHeader online={online} updatedAt={data.updatedAt} />

      {loading ? (
        <Loading />
      ) : (
        <div className="bar-radio-layout">
          <div className="bar-radio-main-column">
            <NowPlayingCard state={{ ...data.state, currentTrack }} />
            <FullPlayer
              playing={playing}
              muted={muted}
              volume={volume}
              listeners={data.state.listeners}
              track={currentTrack}
              streamAvailable={Boolean(streamUrl)}
              onToggle={handleToggle}
              onMute={handleMute}
              onVolume={handleVolume}
            />
            <RadioStatusCard status={data.status} health={data.health} />
          </div>

          <aside className="bar-radio-side-column">
            <NextTrackPanel track={nextTrack} />
            <HistoryPanel tracks={data.history} />
            <LibraryPanel health={data.health} />
            <StatisticsCard state={data.state} health={data.health} />
            <HealthCard health={data.health} error={data.error} />
          </aside>
        </div>
      )}
    </div>
  );
}
