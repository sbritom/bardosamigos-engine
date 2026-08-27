import { useRadioEngineStore } from "../store/radioStore";
import { StreamingService } from "../services/streamService";

export function useStreaming() {
  const { state, dispatch } = useRadioEngineStore();

  return {
    config: state.config,
    status: state.status,
    autoDj: state.autoDj,
    service: StreamingService,
    loading: state.loading,
    error: state.api?.error,
    fallback: state.api?.fallback,
    updateConfig: (payload) => dispatch({ type: "setConfig", payload }),
    setStatus: (payload) => dispatch({ type: "setStatus", payload }),
  };
}
