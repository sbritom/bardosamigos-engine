import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { RadioEngine } from "../core/RadioEngine.js";

function createFakeAudioLibrary(root) {
  const musicFolder = path.join(root, "radio", "music");
  const categories = ["Sertanejo", "Pagode", "Rock"];

  categories.forEach((category, index) => {
    const folder = path.join(musicFolder, category);
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, `Artista ${index + 1} - Musica ${index + 1}.mp3`), `fake-audio-${index}`);
  });

  return musicFolder;
}

async function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bar-radio-engine-"));
  const musicFolder = createFakeAudioLibrary(root);
  const logFolder = path.join(root, "logs");
  const engine = new RadioEngine({
    env: {
      RADIO_LIBRARY_PATH: musicFolder,
      RADIO_LOG_FOLDER: logFolder,
      RADIO_ENGINE_PORT: "0",
      AUTO_DJ_ENABLED: "true",
    },
  });

  await engine.start();

  assert.equal(engine.state, "READY");
  assert.equal(engine.library.list().length, 3, "Biblioteca carregada");
  assert.ok(engine.library.list()[0].hash, "Metadados lidos");
  assert.equal(engine.playlist.tracks.length, 3, "Playlist criada");
  assert.ok(engine.playlist.shuffle().length === 3, "Shuffle funcionando");

  const queued = engine.playlist.addToQueue(engine.library.list()[0], 10);
  assert.equal(engine.playlist.queueList().length, 1, "Queue funcionando");
  engine.playlist.removeFromQueue(queued.id);

  engine.history.add(engine.library.list()[0]);
  assert.equal(engine.history.list().length >= 1, true, "History funcionando");

  assert.equal(engine.scheduler.active, true, "Scheduler iniciado");
  assert.equal(engine.autodj.active, true, "AutoDJ iniciado");
  assert.ok(engine.api.server, "API iniciada");
  assert.ok(fs.existsSync(path.join(logFolder, "engine.log")), "Logs funcionando");

  await engine.stop();
  fs.rmSync(root, { recursive: true, force: true });

  console.info("✓ Testes internos da Bar Streaming Engine passaram");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
