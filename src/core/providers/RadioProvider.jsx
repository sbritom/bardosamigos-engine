import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const RadioContext = createContext(null);

const RADIO_STREAM_URL =
  import.meta.env.VITE_RADIO_STREAM_URL ||
  "https://stm1.mxcast.com.br:7186/stream";
const RADIO_API_BASE_URL = String(
  import.meta.env.VITE_RADIO_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:3333" : "")
).replace(/\/+$/, "");
const RADIO_STATS_URL =
  import.meta.env.VITE_RADIO_STATUS_URL ||
  import.meta.env.VITE_RADIO_STATS_URL ||
  (import.meta.env.DEV
    ? `${RADIO_API_BASE_URL}/engine/radio/mxcast/status`
    : "/api/radio/stats");
const METADATA_REFRESH_INTERVAL = 15000;

const INITIAL_STATION = {
  name: "Rádio Bar dos Amigos",
  program: "Rádio Bar dos Amigos",
  currentTrack: "Carregando música atual...",
  artist: "Rádio Bar dos Amigos",
  albumCover: "",
  requestEnabled: false,
  history: [],
  url: RADIO_STREAM_URL,
  cover: "",
  online: false,
  listeners: 0,
  peakListeners: 0,
  bitrate: 320,
};

function parseSongTitle(rawTitle) {
  const title = String(rawTitle || "").trim();

  if (!title) {
    return {
      artist: "Rádio Bar dos Amigos",
      track: "Programação ao vivo",
    };
  }

  const separators = [" - ", " – ", " — "];

  for (const separator of separators) {
    if (title.includes(separator)) {
      const [artist, ...trackParts] = title.split(separator);
      const track = trackParts.join(separator).trim();

      if (artist.trim() && track) {
        return {
          artist: artist.trim(),
          track,
        };
      }
    }
  }

  return {
    artist: "Rádio Bar dos Amigos",
    track: title,
  };
}

export function RadioProvider({ children }) {
  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(70);
  const [currentStation, setCurrentStation] = useState(INITIAL_STATION);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    let active = true;
    let refreshTimer = null;

    async function loadMetadata() {
      try {
        const response = await fetch(RADIO_STATS_URL, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const data = payload?.data || {};

        if (!active) return;

        const song = parseSongTitle(data.songTitle);

        setCurrentStation((previous) => ({
          ...previous,
          name: data.serverTitle || "Rádio Bar dos Amigos",
          program: data.online
            ? `${data.listeners || 0} ${(data.listeners || 0) === 1 ? "ouvinte" : "ouvintes"}`
            : "Transmissão offline",
          currentTrack: song.track,
          artist: song.artist,
          online: Boolean(data.online),
          listeners: Number(data.listeners) || 0,
          peakListeners: Number(data.peakListeners) || 0,
          bitrate: Number(data.bitrate) || 320,
          cover: data.cover || "",
        }));
      } catch (metadataError) {
        console.warn(
          "Não foi possível atualizar os metadados da rádio:",
          metadataError
        );

        if (!active) return;

        setCurrentStation((previous) => ({
          ...previous,
          name: "Rádio Bar dos Amigos",
          program: "Rádio Bar dos Amigos",
        }));
      } finally {
        if (active) {
          refreshTimer = window.setTimeout(
            loadMetadata,
            METADATA_REFRESH_INTERVAL
          );
        }
      }
    }

    loadMetadata();

    return () => {
      active = false;

      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, []);

  async function play() {
    if (!audioRef.current) return;

    try {
      setError("");
      setLoading(true);

      await audioRef.current.play();

      setPlaying(true);
    } catch (playError) {
      setPlaying(false);
      setError("Não foi possível conectar à rádio agora.");
      console.error("Erro ao tocar rádio:", playError);
    } finally {
      setLoading(false);
    }
  }

  function pause() {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setPlaying(false);
    setLoading(false);
  }

  function toggle() {
    playing ? pause() : play();
  }

  function handleVolumeChange(value) {
    const nextVolume = Math.min(Math.max(Number(value), 0), 100);

    setVolume(nextVolume);
  }

  return (
    <RadioContext.Provider
      value={{
        playing,
        loading,
        error,
        currentStation,
        play,
        pause,
        toggle,
        volume,
        setVolume: handleVolumeChange,
      }}
    >
      {children}

      <audio
        ref={audioRef}
        src={RADIO_STREAM_URL}
        preload="none"
        onCanPlay={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setPlaying(false);
          setError("Conexão com a rádio indisponível.");
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => {
          setError("");
          setPlaying(true);
          setLoading(false);
        }}
        onWaiting={() => setLoading(true)}
      />
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);

  if (!context) {
    throw new Error("useRadio deve ser usado dentro de RadioProvider");
  }

  return context;
}
