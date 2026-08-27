import { useEffect, useRef, useState } from "react";
import { radioApiConfig } from "../config";
import { useRadioEngineStore } from "../store/radioStore";

export function usePlayer() {
  const audioRef = useRef(null);
  const { state } = useRadioEngineStore();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(state.config.defaultVolume);
  const [error, setError] = useState("");
  const streamUrl = radioApiConfig.streamUrl || state.config.streamUrl;
  const hasStream = Boolean(streamUrl);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
    }
  }, [muted, volume]);

  async function toggle() {
    if (!audioRef.current || !hasStream) {
      setError("Stream ainda nao configurado.");
      return;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    try {
      setError("");
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("Nao foi possivel conectar ao stream.");
    }
  }

  return {
    audioRef,
    playing,
    muted,
    volume,
    error,
    loading: state.loading,
    fallback: state.api?.fallback,
    hasStream,
    setVolume,
    setMuted,
    setPlaying,
    setError,
    toggle,
    streamUrl,
  };
}
