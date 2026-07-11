import path from "node:path";

export class ServiceInstaller {
  constructor(config) {
    this.config = config;
  }

  serviceDefinition() {
    return `[Unit]
Description=Bar Radio Engine
After=network.target icecast2.service
Wants=icecast2.service

[Service]
Type=simple
WorkingDirectory=${this.config.projectRoot}
ExecStart=/usr/bin/npm run radio
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=RADIO_STREAM_ON_START=true

[Install]
WantedBy=multi-user.target
`;
  }

  installPlan() {
    return {
      serviceName: "bar-radio.service",
      source: path.join(this.config.projectRoot, "scripts", "bar-radio.service"),
      destination: "/etc/systemd/system/bar-radio.service",
      commands: [
        "sudo cp scripts/bar-radio.service /etc/systemd/system/bar-radio.service",
        "sudo systemctl daemon-reload",
        "sudo systemctl enable icecast2",
        "sudo systemctl enable bar-radio",
        "sudo systemctl restart icecast2",
        "sudo systemctl restart bar-radio",
      ],
    };
  }
}
