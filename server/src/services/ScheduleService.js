import { radioDataStore } from "./dataStore.js";

export const ScheduleService = {
  listSchedule() {
    return radioDataStore.schedule;
  },

  getCurrentBlock(now = new Date()) {
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now).toLowerCase();
    const time = now.toTimeString().slice(0, 5);

    return radioDataStore.schedule.find(
      (block) => block.day.toLowerCase() === weekday && block.start <= time && (!block.end || block.end >= time),
    ) || null;
  },
};
