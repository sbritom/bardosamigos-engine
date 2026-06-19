import { create } from "zustand";

const usePlayerStore = create((set) => ({

  playing: false,

  volume: 70,

  currentTrack: null,

  progress: 0,

  duration: 0,

  setPlaying: (playing) =>
    set({
      playing,
    }),

  setVolume: (volume) =>
    set({
      volume,
    }),

  setCurrentTrack: (track) =>
    set({
      currentTrack: track,
    }),

  setProgress: (progress) =>
    set({
      progress,
    }),

  setDuration: (duration) =>
    set({
      duration,
    }),

}));

export default usePlayerStore;