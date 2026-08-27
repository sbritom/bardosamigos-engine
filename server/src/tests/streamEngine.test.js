import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { RadioEngine } from "../core/RadioEngine.js";
import { runFFmpegAudioPipelineLifecycleTests } from "./ffmpegAudioPipelineLifecycle.test.js";

function createFakeAudio(root) {
  const musicFolder = path.join(root, "radio", "music", "Pagode");
  fs.mkdirSync(musicFolder, { recursive: true });
  fs.writeFileSync(path.join(musicFolder, "Banda Teste - Musica Stream.mp3"), "fake-audio-stream");
  return path.join(root, "radio", "music");
}

async function run() {
  await runFFmpegAudioPipelineLifecycleTests();

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bar-radio-stream-"));
  const musicFolder = createFakeAudio(root);
  const logFolder = path.join(root, "logs");
  const engine = new RadioEngine({
    env: {
      RADIO_LIBRARY_PATH: musicFolder,
      RADIO_LOG_FOLDER: logFolder,
      RADIO_ENGINE_PORT: "0",
      STREAM_DRY_RUN: "true",
      AUTO_DJ_ENABLED: "true",
    },
  });

  await engine.start();
  const status = await engine.startStreaming({ once: true });

  assert.equal(engine.library.list().length, 1, "Biblioteca carregada");
  assert.equal(engine.getStatus().libraryPath, musicFolder, "Caminho da biblioteca detectado");
  assert.equal(engine.getStatus().libraryPathFound, true, "Biblioteca marcada como encontrada");
  assert.equal(engine.ffmpeg.status().dryRun, true, "FFmpeg dry-run ativo");
  assert.equal(engine.icecast.status().connected, true, "Icecast conectado");
  assert.ok(engine.history.list().length >= 1, "History atualizado");
  assert.equal(status.currentTrack.title, "Musica Stream", "Now Playing atualizado durante a transmissao");
  assert.equal(status.currentTrack.title, "Musica Stream", "Musica transmitida");

  await engine.stop();
  fs.rmSync(root, { recursive: true, force: true });
  console.info("✓ Testes de streaming da Bar Streaming Engine passaram");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
