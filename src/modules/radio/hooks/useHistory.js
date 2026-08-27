import { useNowPlaying } from "./useNowPlaying";

export function useHistory() {
  const nowPlaying = useNowPlaying();

  return {
    history: nowPlaying.history,
    loading: nowPlaying.loading,
    error: nowPlaying.error,
    fallback: nowPlaying.fallback,
  };
}
