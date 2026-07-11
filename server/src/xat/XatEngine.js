import { XatConfig } from "./XatConfig.js";
import { XatWidgetService } from "./XatWidgetService.js";

export class XatEngine {
  constructor({ radioConfig, playerEngine, logger = null, eventBus = null, env = process.env } = {}) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.config = new XatConfig({ env, radioConfig }).load();
    this.widgetService = new XatWidgetService({ config: this.config, playerEngine });
    this.ready = false;
  }

  init() {
    this.ready = true;
    this.logger?.info("xat", "Xat configuration loaded.", this.safeConfig());
    this.logger?.info("xat", "Xat Engine initialized.", { enabled: this.config.enabled });
    this.eventBus?.emit("xat:ready", this.status());
    if (this.config.enabled) {
      this.eventBus?.emit("xat:connected", this.status());
    }
    return this.status();
  }

  getConfig() {
    return this.safeConfig();
  }

  status() {
    const widget = this.widgetService.getWidget();
    return {
      enabled: this.config.enabled,
      ready: this.ready,
      status: this.config.enabled ? widget.status : "OFFLINE",
      updatedAt: widget.updatedAt,
      stream: widget.stream,
    };
  }

  widget() {
    const widget = this.widgetService.getWidget();
    this.logger?.info("xat", "Widget updated.", { status: widget.status, trackId: widget.track?.id || null });
    this.eventBus?.emit("xat:widgetUpdated", widget);
    return widget;
  }

  stream() {
    const stream = this.widgetService.getStream();
    this.logger?.info("xat", "Stream URL generated.", {
      host: stream.host,
      port: stream.port,
      mount: stream.mount,
      radioHtml5: stream.radioHtml5,
    });
    return stream;
  }

  safeConfig() {
    return {
      enabled: this.config.enabled,
      host: this.config.host,
      port: this.config.port,
      mount: this.config.mount,
      protocol: this.config.protocol,
      widgetRefresh: this.config.widgetRefresh,
      theme: this.config.theme,
    };
  }
}
