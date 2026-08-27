import { radioApi } from "../api";

export const ListenerService = {
  getRealtimeListeners(options) {
    return radioApi.listListeners(options);
  },
};

export const listenerService = ListenerService;
