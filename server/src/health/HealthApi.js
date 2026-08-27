export class HealthApi {
  constructor(healthEngine) {
    this.healthEngine = healthEngine;
  }

  health() {
    return this.healthEngine.run();
  }

  report() {
    return {
      text: this.healthEngine.text(),
      data: this.healthEngine.lastReport || this.healthEngine.run(),
    };
  }

  modules() {
    return this.healthEngine.modules();
  }

  events() {
    return this.healthEngine.events();
  }

  version() {
    return this.healthEngine.versionInfo();
  }
}
