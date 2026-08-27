import { RadioEngine } from "./core/RadioEngine.js";

process.env.LOG_LEVEL = process.env.LOG_LEVEL || "debug";
process.env.RADIO_STREAM_ON_START = "false";

const engine = new RadioEngine();
let previousMounts = new Set();

function formatMount(mount) {
  return `${mount.mount || "(sem mount)"} | listeners=${mount.listeners || 0} | bitrate=${mount.bitrate || "-"} | type=${mount.contentType || "-"}`;
}

await engine.start();
console.info("[stream:watch] Engine iniciada. Monitorando Icecast continuamente.");

async function tick() {
  await engine.icecast.refreshMountStatus();
  const debug = engine.icecast.debugStatus(engine.ffmpeg.status());
  const currentMounts = new Set(debug.mounts.map((mount) => mount.mount).filter(Boolean));
  const added = [...currentMounts].filter((mount) => !previousMounts.has(mount));
  const removed = [...previousMounts].filter((mount) => !currentMounts.has(mount));

  console.info("[stream:watch] Icecast");
  console.info(`HTTP ${debug.httpStatus || "N/A"} | expected=${debug.mountExpected} | found=${debug.mountFound || "none"} | response=${debug.responseTimeMs ?? "N/A"}ms`);

  if (debug.mounts.length === 0) {
    console.info("Mounts ativos: nenhum");
  } else {
    console.info("Mounts ativos:");
    debug.mounts.forEach((mount) => console.info(`- ${formatMount(mount)}`));
  }

  added.forEach((mount) => console.info(`Novo mount: ${mount}`));
  removed.forEach((mount) => console.info(`Mount removido: ${mount}`));
  previousMounts = currentMounts;
}

await tick();
const timer = setInterval(tick, 3000);

async function shutdown() {
  clearInterval(timer);
  await engine.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
