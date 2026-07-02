import { radioApi } from "../api";

export const ScheduleService = {
  listWeeklySchedule(options) {
    return radioApi.listSchedule(options);
  },

  getCurrentBlock(schedule = [], now = new Date()) {
    const day = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now);
    const currentTime = now.toTimeString().slice(0, 5);

    return schedule.find(
      (block) =>
        block.day?.toLowerCase() === day.toLowerCase() &&
        block.start <= currentTime &&
        (!block.end || block.end >= currentTime),
    ) || null;
  },
};

export const scheduleService = ScheduleService;
