import { createContext, createElement, useContext, useEffect, useMemo, useReducer } from "react";
import { radioApiConfig } from "../config";
import { RadioEngine } from "../services/radioEngine";
import { radioInitialState } from "./radioMocks";

const RadioEngineContext = createContext(null);

function radioReducer(state, action) {
  switch (action.type) {
    case "setConfig":
      return { ...state, config: { ...state.config, ...action.payload } };
    case "toggleFavorite":
      return {
        ...state,
        tracks: state.tracks.map((track) =>
          track.id === action.payload ? { ...track, favorite: !track.favorite } : track,
        ),
      };
    case "addUpload":
      return {
        ...state,
        tracks: [action.payload, ...state.tracks],
        status: { ...state.status, lastUploadAt: new Date().toISOString() },
      };
    case "setStatus":
      return { ...state, status: { ...state.status, ...action.payload } };
    case "hydrate":
      return { ...state, ...action.payload, loading: false };
    case "setLoading":
      return { ...state, loading: action.payload };
    case "setApiState":
      return { ...state, api: { ...state.api, ...action.payload }, loading: false };
    case "setNowPlaying":
      return {
        ...state,
        nowPlaying: action.payload,
        status: {
          ...state.status,
          currentTrackId: action.payload.current?.id || state.status.currentTrackId,
          nextTrackId: action.payload.next?.id || state.status.nextTrackId,
          remainingSeconds: action.payload.remainingSeconds ?? state.status.remainingSeconds,
        },
      };
    default:
      return state;
  }
}

export function RadioEngineProvider({ children, initialState = radioInitialState }) {
  const [state, dispatch] = useReducer(radioReducer, {
    ...initialState,
    loading: true,
    api: { fallback: false, error: null },
  });
  const value = useMemo(() => ({ state, dispatch }), [state]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const nextState = await RadioEngine.loadInitialState();
        if (active) {
          dispatch({ type: "hydrate", payload: nextState });
        }
      } catch (error) {
        if (active) {
          dispatch({ type: "setApiState", payload: { error, fallback: true } });
        }
      }
    }

    hydrate();
    const interval = window.setInterval(hydrate, radioApiConfig.pollingInterval);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return createElement(RadioEngineContext.Provider, { value }, children);
}

export function useRadioEngineStore() {
  const context = useContext(RadioEngineContext);
  if (!context) {
    throw new Error("useRadioEngineStore must be used inside RadioEngineProvider");
  }
  return context;
}
