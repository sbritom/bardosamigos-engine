import { radioApi } from "../api";

export const StatsService = {
  getStats(options) {
    return radioApi.getStats(options);
  },
};

export const statsService = StatsService;
