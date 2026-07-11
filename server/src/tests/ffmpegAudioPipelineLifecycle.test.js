import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { pathToFileURL } from "node:url";

import { AudioPipeline } from "../audio/AudioPipeline.js";
import { AutoDJEngine } from "../autodj/AutoDJEngine.js";
import { AudioQueue } from "../audio/AudioQueue.js";
import { FFmpegEngine } from "../ffmpeg/FFmpegEngine.js";
import { PlaylistEngine } from "../library/PlaylistEngine.js";
import { StreamEngine } from "../stream/StreamEngine.js";

const logger = {
  config: {},
  info() {},
  warn() {},
  error() {},
};

class FakeProcess extends EventEmitter {
  constructor(pid) {
    super();
    this.pid = pid;
    this.stdout = new PassThrough();
    this.stderr = new PassThrough();
    this.killed = false;
    this.exitCode = null;
  }

  kill(signal = "SIGTERM") {
    this.killed = true;
    setImmediate(() => this.finish(null, signal));
    return true;
  }

  finish(code = 0, signal = null) {
    this.exitCode = code;
    this.emit("exit", code, signal);
  }
}

function createTempTrack(root, id) {
  const filePath = path.join(root, `${id}.mp3`);
  fs.writeFileSync(filePath, `audio-${id}`);
  return {
    id,
    title: `Track ${id}`,
    artist: `Artist ${id}`,
    genre: "Genre",
    path: filePath,
  };
}

function createFFmpeg(spawned) {
  let nextPid = 7000;
  const ffmpeg = new FFmpegEngine(
    { stream: { dryRun: false }, ffmpeg: {}, logLevel: "info" },
    logger,
    {
      spawnFactory: () => {
        const process = new FakeProcess(nextPid);
        nextPid += 1;
        spawned.push(process);
        return process;
      },
    },
  );
  ffmpeg.executablePath = "ffmpeg";
  return ffmpeg;
}

function createDirectPipeline(ffmpeg) {
  return new AudioPipeline({
    ffmpeg,
    logger,
    encoder: {
      config: { bitrate: "128k" },
      getIcecastFFmpegArgs(inputPath, outputUrl) {
        return ["-i", inputPath, outputUrl];
      },
    },
    icecast: {
      config: {
        mount: "/radio",
        protocol: "icecast",
        host: "localhost",
        port: 8000,
        username: "source",
      },
      getSourceUrl() {
        return "icecast://source:***@localhost:8000/radio";
      },
      prepareForExternalSource() {},
      connect() {
        return null;
      },
      updateMetadata() {},
      disconnect() {},
      status() {
        return { connected: true, mountActive: true };
      },
      waitForMount() {
        return Promise.resolve({ mountActive: true });
      },
    },
  });
}

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertPending(promise, message) {
  const result = await Promise.race([
    promise.then(() => "resolved", () => "rejected"),
    wait(20).then(() => "pending"),
  ]);
  assert.equal(result, "pending", message);
}

export async function runFFmpegAudioPipelineLifecycleTests() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bar-ffmpeg-lifecycle-"));

  try {
    const trackA = createTempTrack(root, "a");
    const trackB = createTempTrack(root, "b");
    const trackC = createTempTrack(root, "c");

    {
      const spawned = [];
      const ffmpeg = createFFmpeg(spawned);
      const first = ffmpeg.start(trackA.path, ["-i", trackA.path, "pipe:1"]);
      const second = ffmpeg.start(trackB.path, ["-i", trackB.path, "pipe:1"]);

      spawned[0].stderr.write("old process stderr");
      spawned[0].finish(0);

      assert.equal(ffmpeg.status().pid, second.processPid, "Callback tardio nao altera PID ativo");
      assert.equal(ffmpeg.status().exitCode, null, "Callback tardio nao sobrescreve exitCode ativo");
      assert.equal(ffmpeg.status().lastStderr, "", "Callback tardio nao sobrescreve stderr ativo");

      spawned[1].finish(0);
      assert.equal(ffmpeg.status().pid, second.processPid, "Processo B permanece como referencia ativa");
      assert.equal(ffmpeg.status().exitCode, 0, "Processo ativo registra termino natural");
      assert.equal(first.processGeneration, 1, "Processo A recebeu geracao propria");
      assert.equal(second.processGeneration, 2, "Processo B recebeu geracao propria");
    }

    {
      const spawned = [];
      const ffmpeg = createFFmpeg(spawned);
      const first = ffmpeg.start(trackA.path, ["-i", trackA.path, "pipe:1"]);
      const second = ffmpeg.start(trackB.path, ["-i", trackB.path, "pipe:1"]);

      ffmpeg.stop(first.process, { reason: "recovery", processGeneration: first.processGeneration });

      assert.equal(spawned[0].killed, true, "stop encerra o processo pretendido");
      assert.equal(spawned[1].killed, false, "stop de processo antigo nao mata processo novo");
      assert.equal(ffmpeg.status().pid, second.processPid, "stop antigo nao troca estado ativo");
    }

    {
      const spawned = [];
      const pipeline = createDirectPipeline(createFFmpeg(spawned));
      let resolved = 0;
      const playPromise = pipeline.play(trackA).then(() => {
        resolved += 1;
      });
      await wait();
      spawned[0].stdout.end();
      await assertPending(playPromise, "stdout end prematuro nao resolve directToIcecast");
      spawned[0].finish(0);
      await playPromise;
      assert.equal(resolved, 1, "AudioPipeline resolve uma unica vez no termino natural");
      assert.equal(pipeline.state, "Finished", "AudioPipeline termina como Finished");
    }

    {
      const spawned = [];
      const pipeline = createDirectPipeline(createFFmpeg(spawned));
      const playPromise = pipeline.play(trackB);
      await wait();
      spawned[0].finish(1);
      await assert.rejects(playPromise, /FFmpeg exited with code 1/, "Exit code diferente de 0 e falha");
      assert.equal(pipeline.state, "Offline", "Falha deixa pipeline Offline");
    }

    {
      const spawned = [];
      const pipeline = createDirectPipeline(createFFmpeg(spawned));
      const playlist = new PlaylistEngine({ getTracks: () => [trackA, trackB, trackC] }, { shuffle: false });
      playlist.init();
      const autodj = new AutoDJEngine(playlist, logger);
      autodj.init();
      const audioQueue = new AudioQueue();
      const stream = new StreamEngine({
        audioQueue,
        audioPipeline: pipeline,
        autodj,
        logger,
        eventBus: { emit() {} },
      });

      const played = [];
      for (let index = 0; index < 3; index += 1) {
        const playPromise = stream.playNextTrack().then((value) => {
          played.push(stream.currentTrack.id);
          return value;
        });
        await wait();
        spawned[index].stderr.write(`stderr-${index}`);
        spawned[index].finish(0);
        assert.equal(await playPromise, true, "Faixa consecutiva termina corretamente");
      }

      assert.deepEqual(played, ["a", "b", "c"], "StreamEngine troca 3 faixas sem callback cruzado");
      assert.deepEqual(audioQueue.played.map((track) => track.id), ["c", "b"], "Preload segue sem salto nem repeticao");
    }

    console.info("OK Testes de ciclo FFmpeg/AudioPipeline passaram");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFFmpegAudioPipelineLifecycleTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
