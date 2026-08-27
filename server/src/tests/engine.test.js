import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { RadioEngine } from "../core/RadioEngine.js";

function createAudioLibrary(root) {
  const musicFolder = path.join(root, "radio", "music", "Teste");
  fs.mkdirSync(musicFolder, { recursive: true });
  fs.writeFileSync(path.join(musicFolder, "Artista Engine - Faixa Engine.mp3"), "fake-audio");
  return path.join(root, "radio", "music");
}

function getJson(port, pathname) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port, path: pathname }, (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => resolve(JSON.parse(body)));
    }).on("error", reject);
  });
}

async function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bar-radio-engine-v2-"));
  const musicFolder = createAudioLibrary(root);
  const logFolder = path.join(root, "logs");
  const cacheFolder = path.join(root, "cache");
  const engine = new RadioEngine({
    env: {
      RADIO_LIBRARY_PATH: musicFolder,
      RADIO_LOG_FOLDER: logFolder,
      RADIO_CACHE_FOLDER: cacheFolder,
      RADIO_ENGINE_PORT: "0",
      STREAM_DRY_RUN: "true",
      AUTO_DJ_ENABLED: "true",
    },
  });

  await engine.start();
  await engine.startStreaming({ once: true });

  const port = engine.api.server.address().port;
  const status = await getJson(port, "/engine/status");
  const health = await getJson(port, "/engine/health");
  const nowPlaying = await getJson(port, "/engine/now-playing");
  const history = await getJson(port, "/engine/history");
  const queue = await getJson(port, "/engine/queue");

  assert.equal(status.ok, true, "Status endpoint respondeu");
  assert.equal(health.ok, true, "Health endpoint respondeu");
  assert.ok(["healthy", "warning"].includes(health.data.health), "Health check OK");
  assert.equal(nowPlaying.data.title, "Faixa Engine", "Now Playing real atualizado");
  assert.equal(history.data.length, 1, "History real atualizado");
  assert.ok(Array.isArray(queue.data), "Queue endpoint respondeu");
  assert.ok(fs.existsSync(path.join(cacheFolder, "library-cache.json")), "Cache da biblioteca criado");

  await engine.stop();
  fs.rmSync(root, { recursive: true, force: true });
  console.info("OK Testes da Bar Streaming Engine v2 passaram");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
