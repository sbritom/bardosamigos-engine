import { useRadioEngineStore } from "../store/radioStore";
import { ListenerService } from "../services/listenerService";

export function useListeners() {
  const { state } = useRadioEngineStore();
  return {
    listeners: state.listeners,
    online: state.status.listenersOnline,
    peak: state.status.audiencePeak,
    today: 342,
    yesterday: 298,
    service: ListenerService,
    loading: state.loading,
    error: state.api?.error,
    fallback: state.api?.fallback,
  };
}
