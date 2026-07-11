import { execFileSync } from "node:child_process";
import os from "node:os";

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  try {
    execFileSync(checker, args, { stdio: "ignore", shell: process.platform !== "win32" });
    return true;
  } catch {
    return false;
  }
}

function commandVersion(command, args = ["--version"]) {
  try {
    if (process.platform === "win32" && command === "npm") {
      return execFileSync("cmd.exe", ["/d", "/s", "/c", "npm --version"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).split("\n")[0];
    }

    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).split("\n")[0];
  } catch {
    return null;
  }
}

export class SystemChecker {
  check() {
    const platform = os.platform();
    const isLinux = platform === "linux";
    const totalMemoryMb = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemoryMb = Math.round(os.freemem() / 1024 / 1024);

    return {
      platform,
      distroSupported: isLinux ? this.isSupportedLinux() : false,
      node: {
        ok: Boolean(process.version),
        version: process.version,
      },
      npm: {
        ok: commandExists("npm"),
        version: commandVersion("npm", ["--version"]),
      },
      ffmpeg: {
        ok: commandExists("ffmpeg"),
        version: commandVersion("ffmpeg", ["-version"]),
      },
      icecast: {
        ok: commandExists("icecast2") || commandExists("icecast"),
        version: commandVersion("icecast2", ["-v"]) || commandVersion("icecast", ["-v"]),
      },
      git: {
        ok: commandExists("git"),
        version: commandVersion("git", ["--version"]),
      },
      curl: {
        ok: commandExists("curl"),
        version: commandVersion("curl", ["--version"]),
      },
      systemd: {
        ok: isLinux && commandExists("systemctl"),
        version: commandVersion("systemctl", ["--version"]),
      },
      resources: {
        cpuCount: os.cpus().length,
        totalMemoryMb,
        freeMemoryMb,
        uptimeSeconds: Math.round(os.uptime()),
      },
      checkedAt: new Date().toISOString(),
    };
  }

  isSupportedLinux() {
    const release = commandVersion("lsb_release", ["-ds"]) || "";
    return /Ubuntu|Debian/i.test(release);
  }
}
