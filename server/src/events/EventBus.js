export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.events = [];
  }

  on(eventName, listener) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(listener);
    return () => this.off(eventName, listener);
  }

  off(eventName, listener) {
    this.listeners.get(eventName)?.delete(listener);
  }

  emit(eventName, payload = {}) {
    this.events.unshift({
      eventName,
      payload,
      emittedAt: new Date().toISOString(),
    });
    this.events = this.events.slice(0, 500);
    const results = [];

    this.listeners.get(eventName)?.forEach((listener) => {
      results.push(listener(payload));
    });

    return results;
  }

  history() {
    return this.events;
  }
}
