export class ReleaseApi {
  constructor(releaseEngine) {
    this.releaseEngine = releaseEngine;
  }

  release() {
    return this.releaseEngine?.status?.() || null;
  }

  status() {
    return this.releaseEngine?.status?.() || null;
  }

  report() {
    return this.releaseEngine?.report?.() || null;
  }

  version() {
    return this.releaseEngine?.version?.() || null;
  }
}
