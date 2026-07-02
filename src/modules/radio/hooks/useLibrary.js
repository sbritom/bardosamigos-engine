import { useMemo, useState } from "react";
import { useRadioEngineStore } from "../store/radioStore";
import { filterTracks } from "../utils/radioSelectors";
import { LibraryService } from "../services/libraryService";

export function useLibrary() {
  const { state, dispatch } = useRadioEngineStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("grid");
  const tracks = useMemo(() => filterTracks(state.tracks, { query, category, view }), [category, query, state.tracks, view]);

  return {
    tracks,
    categories: state.categories,
    service: LibraryService,
    loading: state.loading,
    error: state.api?.error,
    fallback: state.api?.fallback,
    query,
    category,
    view,
    setQuery,
    setCategory,
    setView,
    toggleFavorite: (trackId) => dispatch({ type: "toggleFavorite", payload: trackId }),
  };
}
