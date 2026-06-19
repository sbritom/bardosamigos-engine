import { createContext, useContext, useRef, useState } from "react";

const RadioContext = createContext(null);

export function RadioProvider({ children }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const [currentStation] = useState({
    name: "Hunter FM Hits Brasil",
    program: "Rádio Bar dos Amigos",
    url: "https://stream.hunter.fm/hits",
    cover: "",
  });

  async function play() {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch (error) {
      console.error("Erro ao tocar rádio:", error);
    }
  }

  function pause() {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setPlaying(false);
  }

  function toggle() {
    playing ? pause() : play();
  }

  return (
    <RadioContext.Provider
      value={{
        playing,
        currentStation,
        play,
        pause,
        toggle,
      }}
    >
      {children}

      <audio ref={audioRef} src={currentStation.url} preload="none" />
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