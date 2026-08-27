export class FirewallManager {
  constructor(config) {
    this.config = config;
  }

  plan() {
    const ports = [
      { port: 80, protocol: "tcp", purpose: "HTTP" },
      { port: 443, protocol: "tcp", purpose: "HTTPS" },
      { port: this.config.streamPort, protocol: "tcp", purpose: "Icecast stream" },
      { port: this.config.apiPort, protocol: "tcp", purpose: "Radio API" },
    ];

    return {
      manager: "ufw",
      ports,
      commands: ports.map((item) => `sudo ufw allow ${item.port}/${item.protocol}`),
      enabledCommand: "sudo ufw enable",
    };
  }
}
