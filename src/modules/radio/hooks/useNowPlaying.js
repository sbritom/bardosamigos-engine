import { useEffect, useMemo } from "react";
import { useRadioEngineStore } from "../store/radioStore";
import { getCurrentTrack, getNextTrack } from "../utils/radioSelectors";
import { NowPlayingService } from "../services/nowPlayingService";

export function useNowPlaying() {
  const { state, dispatch } = useRadioEngineStore();

  useEffect(() => {
    return NowPlayingService.subscribe((result) => {
      if (result.data) {
        dispatch({ type: "setNowPlaying", payload: result.data });
      }
    });
  }, [dispatch]);

  return useMemo(
    () => ({
      current: getCurrentTrack(state),
      next: getNextTrack(state),
      history: state.nowPlaying?.history || state.tracks.slice(1, 4),
      remainingSeconds: state.status.remainingSeconds,
      loading: state.loading,
      error: state.api?.error,
      fallback: state.api?.fallback,
    }),
    [state],
  );
}
