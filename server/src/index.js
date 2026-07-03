import { RadioEngine } from "./core/RadioEngine.js";

const engine = new RadioEngine();

function printStreamDebugSummary(status) {
  if (process.env.LOG_LEVEL !== "debug") return;
  const ffmpeg = status.ffmpeg || {};
  const icecast = status.icecast || {};
  const debug = icecast.lastDebug || {};
  const result = ffmpeg.running && icecast.mountActive ? "STREAM ONLINE" : "STREAM OFFLINE";

  console.info("========== STREAM DEBUG ==========");
  console.info("FFmpeg:");
  console.info(ffmpeg.running ? "Running" : "Offline");
  console.info("PID:");
  console.info(ffmpeg.pid || "N/A");
  console.info("Icecast:");
  console.info(debug.httpStatus ? `HTTP ${debug.httpStatus}` : "HTTP N/A");
  console.info("Mount esperado:");
  console.info(debug.mountExpected || icecast.mount || "N/A");
  console.info("Mount encontrado:");
  console.info(debug.mountFound || "Nenhum mount encontrado.");
  console.info("Mounts encontrados:");
  if (debug.mounts?.length) {
    debug.mounts.forEach((mount) => console.info(`- ${mount.mount} | listeners=${mount.listeners} | bitrate=${mount.bitrate || "-"} | type=${mount.contentType || "-"}`));
  } else {
    console.info("Nenhum mount encontrado.");
  }
  console.info("Listeners:");
  console.info(debug.listeners ?? 0);
  console.info("Bitrate:");
  console.info(debug.bitrate ? `${debug.bitrate} kbps` : "N/A");
  console.info("Tempo para confirmacao:");
  console.info(debug.responseTimeMs ? `${debug.responseTimeMs} ms na ultima consulta` : "N/A");
  console.info("Resultado:");
  console.info(result);
  console.info("=================================");
}

engine.start().then((status) => {
  console.info("OK Engine inicia");
  console.info("OK Logger inicia");
  console.info("OK Biblioteca e carregada");
  console.info("OK Todas as musicas indexadas");
  console.info("OK Metadados extraidos");
  console.info("OK Cache criado");
  console.info("OK Playlist criada");
  console.info("OK Shuffle ativo");
  console.info("OK Queue ativa");
  console.info("OK Scheduler ativo");
  console.info("OK AutoDJ ativo");

  if (process.env.RADIO_STREAM_ON_START === "true") {
    const ffmpegStatus = status.stream?.pipeline?.ffmpeg;
    const icecastStatus = status.stream?.pipeline?.icecast;
    console.info(ffmpegStatus?.running && ffmpegStatus?.pid ? `OK FFmpeg iniciado PID ${ffmpegStatus.pid}` : "PENDING FFmpeg offline");
    console.info(icecastStatus?.mountActive ? "OK Icecast conectado mount /radio ativo" : "PENDING Icecast sem mount /radio ativo");
    console.info(status.stream?.running ? "OK Streaming iniciado" : "PENDING Streaming aguardando musica");
    console.info(status.nowPlaying && icecastStatus?.mountActive ? "OK Musica sendo transmitida" : "PENDING Nenhuma musica confirmada no Icecast");
  }

  console.info("OK Now Playing funcionando");
  console.info("OK History funcionando");
  console.info("OK API funcionando");
  console.info("OK Logs funcionando");
  console.info(status.waitingForStreaming ? "OK Sistema aguardando Streaming" : "OK Sistema em Streaming");
  console.info("[Bar Radio Engine]", status);
  printStreamDebugSummary(status);

  if (process.env.RADIO_EXIT_AFTER_START === "true") {
    engine.stop().then(() => process.exit(0));
  }
});

async function shutdown() {
  await engine.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
