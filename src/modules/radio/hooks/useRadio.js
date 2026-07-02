import { useRadioEngineStore } from "../store/radioStore";

export function useRadio() {
  const { state } = useRadioEngineStore();

  return {
    state,
    loading: state.loading,
    error: state.api?.error,
    fallback: state.api?.fallback,
    online: Boolean(state.status.online),
  };
}
