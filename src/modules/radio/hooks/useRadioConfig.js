import { useRadioEngineStore } from "../store/radioStore";

export function useRadioConfig() {
  const { state, dispatch } = useRadioEngineStore();

  return {
    config: state.config,
    loading: state.loading,
    error: state.api?.error,
    fallback: state.api?.fallback,
    updateConfig: (payload) => dispatch({ type: "setConfig", payload }),
  };
}
