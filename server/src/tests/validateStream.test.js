import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

import { ConfigEngine } from "../config/ConfigEngine.js";

function ok(label, details = "") {
  console.info(`OK ${label}${details ? ` - ${details}` : ""}`);
}

function fail(label, details = "") {
  console.error(`FAIL ${label}${details ? ` - ${details}` : ""}`);
}

function checkFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(label, filePath);
    return false;
  }
  ok(label, filePath);
  return true;
}

function checkFolder(folderPath, label) {
  if (!fs.existsSync(folderPath)) {
    fail(label, folderPath);
    return false;
  }
  ok(label, folderPath);
  return true;
}

function commandWorks(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { windowsHide: true });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve(false);
    }, 5000);

    child.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

function portAcceptsConnection(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 3000 });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function run() {
  const projectRoot = path.resolve(process.cwd());
  const config = new ConfigEngine(process.env).load();
  const checks = [];

  checks.push(checkFile(path.join(projectRoot, "config", "stream.json"), "config/stream.json encontrado"));
  checks.push(checkFile(path.join(projectRoot, "config", "audio.json"), "config/audio.json encontrado"));
  checks.push(checkFile(path.join(projectRoot, "config", "ffmpeg.json"), "config/ffmpeg.json encontrado"));
  checks.push(checkFile(path.join(projectRoot, "config", "icecast.json"), "config/icecast.json encontrado"));
  checks.push(checkFolder(config.musicFolder, "pasta de musicas encontrada"));
  checks.push(checkFolder(config.logFolder, "pasta de logs encontrada"));

  const ffmpegCommand = config.ffmpeg.executablePath || (process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  const ffmpegOk = await commandWorks(ffmpegCommand, ["-version"]);
  checks.push(ffmpegOk);
  if (ffmpegOk) ok("FFmpeg executavel validado", ffmpegCommand);
  else fail("FFmpeg nao encontrado ou indisponivel", ffmpegCommand);

  const icecastOk = await portAcceptsConnection(config.stream.host, config.stream.port);
  checks.push(icecastOk);
  if (icecastOk) ok("Icecast aceitando conexoes", `${config.stream.host}:${config.stream.port}`);
  else fail("Icecast nao esta aceitando conexoes", `${config.stream.host}:${config.stream.port}`);

  if (checks.every(Boolean)) {
    console.info("OK Bar Streaming Engine pronta para transmissao real.");
    return;
  }

  if (process.env.ALLOW_STREAM_PENDING === "true") {
    console.info("PENDING Validacao concluida com pendencias permitidas por ALLOW_STREAM_PENDING=true.");
    return;
  }

  process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
