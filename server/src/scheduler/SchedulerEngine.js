export class SchedulerEngine {
  constructor(logger) {
    this.logger = logger;
    this.daily = [];
    this.weekly = [];
    this.specialDates = [];
    this.events = [];
    this.active = false;
  }

  init() {
    this.active = true;
    this.logger.info("scheduler", "Scheduler ativo.", {
      daily: this.daily.length,
      weekly: this.weekly.length,
      specialDates: this.specialDates.length,
    });
  }

  addDaily(event) {
    this.daily.push(event);
  }

  addWeekly(event) {
    this.weekly.push(event);
  }

  addSpecialDate(event) {
    this.specialDates.push(event);
  }

  addEvent(event) {
    this.events.push(event);
  }

  getDueEvents(now = new Date()) {
    const currentTime = now.toTimeString().slice(0, 5);
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now).toLowerCase();
    const date = now.toISOString().slice(0, 10);

    return [
      ...this.daily.filter((event) => event.time === currentTime),
      ...this.weekly.filter((event) => event.day?.toLowerCase() === weekday && event.time === currentTime),
      ...this.specialDates.filter((event) => event.date === date),
      ...this.events.filter((event) => event.startsAt && new Date(event.startsAt) <= now),
    ];
  }

  list() {
    return {
      daily: this.daily,
      weekly: this.weekly,
      specialDates: this.specialDates,
      events: this.events,
    };
  }
}
