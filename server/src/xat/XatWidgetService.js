export class XatWidgetService {
  constructor({ config, playerEngine = null } = {}) {
    this.config = config;
    this.playerEngine = playerEngine;
    this.updatedAt = null;
  }

  getWidget() {
    const state = this.playerEngine?.getState?.() || {};
    const track = state.currentTrack || null;
    this.updatedAt = new Date().toISOString();

    return {
      radioName: "Radio Bar dos Amigos",
      status: this.resolveStatus(state.status),
      track: track
        ? {
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            cover: state.cover || null,
          }
        : null,
      stream: this.getStream(),
      refresh: this.config.widgetRefresh,
      theme: this.config.theme,
      updatedAt: this.updatedAt,
    };
  }

  getStream() {
    const mount = String(this.config.mount || "/radio").replace(/^\//, "");
    return {
      protocol: this.config.protocol,
      host: this.config.host,
      port: this.config.port,
      mount: this.config.mount,
      radioHtml5: `[radiohtml5:${this.config.host}:${this.config.port}:${mount}]`,
      url: `${this.config.protocol}://${this.config.host}:${this.config.port}${this.config.mount}`,
    };
  }

  resolveStatus(status) {
    const normalized = String(status || "").toLowerCase();
    if (["playing", "online", "streaming"].includes(normalized)) return "ONLINE";
    if (["buffering", "loading"].includes(normalized)) return "BUFFERING";
    if (["reconnecting"].includes(normalized)) return "RECONNECTING";
    return "OFFLINE";
  }
}
