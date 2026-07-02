import { createContext, useContext, useEffect, useRef, useState } from "react";

const RadioContext = createContext(null);
const RADIO_STREAM_URL = "https://live.hunter.fm/hitsbrasil_stream?ag=mp3/";

export function RadioProvider({ children }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(70);

  const [currentStation] = useState({
    name: "Hunter FM Hits Brasil",
    program: "Radio Bar dos Amigos",
    currentTrack: "Programacao ao vivo",
    artist: "",
    albumCover: "",
    requestEnabled: false,
    history: [],
    url: RADIO_STREAM_URL,
    cover: "",
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  async function play() {
    if (!audioRef.current) return;

    try {
      setError("");
      setLoading(true);
      await audioRef.current.play();
      setPlaying(true);
    } catch (playError) {
      setPlaying(false);
      setError("Nao foi possivel conectar a radio agora.");
      console.error("Erro ao tocar radio:", playError);
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
        src={currentStation.url}
        preload="none"
        onCanPlay={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setPlaying(false);
          setError("Conexao com a radio indisponivel.");
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
