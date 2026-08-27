export class XatApi {
  constructor(xatEngine) {
    this.xatEngine = xatEngine;
  }

  config() {
    return this.xatEngine?.getConfig?.() || null;
  }

  status() {
    return this.xatEngine?.status?.() || { enabled: false, ready: false, status: "OFFLINE" };
  }

  widget() {
    return this.xatEngine?.widget?.() || null;
  }

  stream() {
    return this.xatEngine?.stream?.() || null;
  }
}
