import { RadioEngine } from "./core/RadioEngine.js";

const engine = new RadioEngine({
  env: {
    ...process.env,
    RADIO_STREAM_ON_START: "false",
  },
});

await engine.start();
const report = engine.healthEngine.run();

console.info(engine.healthEngine.text());
[
  ["Icecast", "icecast"],
  ["FFmpeg", "ffmpeg"],
  ["Stream", "stream"],
  ["Library", "library"],
  ["Metadata", "metadata"],
  ["Cover", "cover"],
  ["Player", "player"],
  ["API", "api"],
  ["AutoDJ", "autodj"],
  ["Queue", "queue"],
  ["Scheduler", "scheduler"],
  ["Events", "events"],
].forEach(([label, key]) => {
  const status = report.modules[key]?.status === "FAIL" ? "x" : "✓";
  console.info(`${status} ${label}`);
});

console.info(report.status === "ONLINE" ? "RADIO ONLINE" : "RADIO OFFLINE");
await engine.stop();

if (report.status !== "ONLINE") {
  process.exitCode = 1;
}
