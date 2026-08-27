export class MigrationManager {
  constructor(engine) {
    this.engine = engine;
  }

  status() {
    const tracks = this.engine?.libraryManager?.getTracks?.() || [];
    const metadataVersions = new Set(tracks.map((track) => track.metadataSchemaVersion).filter(Boolean));

    return {
      required: [],
      pending: [],
      metadataSchemaVersions: [...metadataVersions],
      storageReady: Boolean(this.engine?.audience && this.engine?.libraryManager),
      checkedAt: new Date().toISOString(),
    };
  }
}
