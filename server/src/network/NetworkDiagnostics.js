import { execFile } from "node:child_process";
import net from "node:net";
import os from "node:os";
import process from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function withTimeout(promise, timeoutMs, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

export class NetworkDiagnostics {
  constructor(config, logger = null) {
    this.config = config;
    this.logger = logger;
    this.hosts = ["localhost", "127.0.0.1", "::1"];
    this.lastResult = null;
  }

  async run({ port = this.config.stream.port } = {}) {
    const startedAt = new Date().toISOString();
    const environment = await this.detectEnvironment();
    const testedHosts = [];

    for (const host of this.hosts) {
      testedHosts.push(await this.testTcp(host, port));
    }

    const listening = await this.findListeningProcess(port);
    const recommendedHost = testedHosts.find((item) => item.ok)?.host || null;
    const result = {
      checkedAt: startedAt,
      os: environment.os,
      hostname: environment.hostname,
      nodeEnvironment: environment.nodeEnvironment,
      ffmpegEnvironment: environment.ffmpegEnvironment,
      wsl: environment.wsl,
      networkInterfaces: environment.networkInterfaces,
      icecastReachable: Boolean(recommendedHost),
      testedHosts,
      icecastProcess: listening,
      recommendedHost,
    };

    this.lastResult = result;
    this.logger?.info("network", "Diagnostico de rede executado.", result);
    return result;
  }

  async testTcp(host, port) {
    const startedAt = Date.now();
    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port, timeout: 3000 });

      socket.on("connect", () => {
        socket.destroy();
        resolve({
          host,
          port,
          ok: true,
          responseTimeMs: Date.now() - startedAt,
          error: null,
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({
          host,
          port,
          ok: false,
          responseTimeMs: Date.now() - startedAt,
          error: "timeout",
        });
      });

      socket.on("error", (error) => {
        resolve({
          host,
          port,
          ok: false,
          responseTimeMs: Date.now() - startedAt,
          error: error.message,
        });
      });
    });
  }

  async detectEnvironment() {
    const platform = process.platform;
    const release = os.release();
    const isWsl = platform === "linux" && (
      Boolean(process.env.WSL_DISTRO_NAME) ||
      release.toLowerCase().includes("microsoft")
    );
    const interfaces = os.networkInterfaces();
    const networkInterfaces = Object.entries(interfaces).flatMap(([name, addresses]) =>
      (addresses || []).map((address) => ({
        name,
        address: address.address,
        family: address.family,
        internal: address.internal,
      })),
    );

    return {
      os: platform === "win32" ? "Windows" : platform === "linux" ? "Linux" : platform,
      hostname: os.hostname(),
      nodeEnvironment: platform === "win32" ? "Windows" : isWsl ? "WSL" : platform,
      ffmpegEnvironment: platform === "win32" ? "Windows" : isWsl ? "WSL" : platform,
      wsl: isWsl ? await this.detectWslDetails() : null,
      networkInterfaces,
    };
  }

  async detectWslDetails() {
    const distro = process.env.WSL_DISTRO_NAME || "unknown";
    const ipOutput = await withTimeout(
      execFileAsync("hostname", ["-I"]).then(({ stdout }) => stdout.trim()).catch(() => ""),
      2000,
      "",
    );
    const routeOutput = await withTimeout(
      execFileAsync("ip", ["route"]).then(({ stdout }) => stdout.trim()).catch(() => ""),
      2000,
      "",
    );
    const windowsHost = routeOutput.match(/default via ([^\s]+)/)?.[1] || null;

    return {
      distro,
      distributionIp: ipOutput.split(/\s+/).filter(Boolean)[0] || null,
      windowsHost,
      route: routeOutput,
    };
  }

  async findListeningProcess(port) {
    if (process.platform === "win32") {
      return this.findWindowsListeningProcess(port);
    }
    return this.findUnixListeningProcess(port);
  }

  async findWindowsListeningProcess(port) {
    const script = [
      `$connections = Get-NetTCPConnection -LocalPort ${Number(port)} -State Listen -ErrorAction SilentlyContinue`,
      "$items = @()",
      "$connections | ForEach-Object {",
      "  $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue",
      "  $items += [PSCustomObject]@{",
      "    pid = $_.OwningProcess",
      "    process = $process.ProcessName",
      "    address = $_.LocalAddress",
      "    port = $_.LocalPort",
      "    state = $_.State",
      "    command = $process.Path",
      "  }",
      "}",
      "$items | ConvertTo-Json -Depth 4",
    ].join("\n");

    try {
      const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", script], { timeout: 5000 });
      if (!stdout.trim()) return { running: false, pid: null, process: null, listeners: [] };
      const parsed = JSON.parse(stdout);
      const listeners = Array.isArray(parsed) ? parsed : [parsed];
      return {
        running: listeners.length > 0,
        pid: listeners[0]?.pid || null,
        process: listeners[0]?.process || null,
        listeners,
      };
    } catch (error) {
      return { running: false, pid: null, process: null, listeners: [], error: error.message };
    }
  }

  async findUnixListeningProcess(port) {
    const commands = [
      ["ss", ["-ltnp"]],
      ["netstat", ["-ltnp"]],
    ];

    for (const [command, args] of commands) {
      try {
        const { stdout } = await execFileAsync(command, args, { timeout: 5000 });
        const lines = stdout.split("\n").filter((line) => line.includes(`:${port}`));
        if (lines.length > 0) {
          return {
            running: true,
            pid: lines[0].match(/pid=(\d+)/)?.[1] || null,
            process: lines[0].match(/users:\(\("([^"]+)/)?.[1] || null,
            listeners: lines.map((line) => ({ raw: line.trim() })),
          };
        }
      } catch {
        // Try next command.
      }
    }

    return { running: false, pid: null, process: null, listeners: [] };
  }

  print(result = this.lastResult) {
    if (!result) return;

    console.info("========== NETWORK DEBUG ==========");
    console.info("Sistema:");
    console.info(result.os);
    console.info("Hostname:");
    console.info(result.hostname);
    console.info("Node:");
    console.info(result.nodeEnvironment);
    console.info("FFmpeg:");
    console.info(result.ffmpegEnvironment);
    console.info("WSL:");
    console.info(result.wsl ? `${result.wsl.distro} ip=${result.wsl.distributionIp || "N/A"} host=${result.wsl.windowsHost || "N/A"}` : "N/A");
    result.testedHosts.forEach((item) => {
      console.info(`TCP ${item.host}:${item.port}`);
      console.info(`${item.ok ? "OK" : "FAIL"} ${item.responseTimeMs}ms${item.error ? ` ${item.error}` : ""}`);
    });
    console.info("Porta 8000");
    console.info(result.icecastProcess.running ? "ABERTA" : "FECHADA");
    console.info("Processo");
    console.info(result.icecastProcess.process || "N/A");
    console.info("PID");
    console.info(result.icecastProcess.pid || "N/A");
    console.info("Host recomendado");
    console.info(result.recommendedHost || "N/A");
    console.info("==================================");
  }
}
