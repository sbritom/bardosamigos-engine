import { RadioEngine } from "./core/RadioEngine.js";

const command = process.argv[2] || "check";
const engine = new RadioEngine({
  env: {
    ...process.env,
    RADIO_STREAM_ON_START: "false",
  },
});

await engine.start();

try {
  const release = engine.release;
  const result = command === "version"
    ? release.version()
    : command === "health"
      ? release.health.run()
      : command === "report"
        ? release.report()
        : release.check();

  console.info(JSON.stringify(result, null, 2));
  if (result.validation?.status === "FAIL" || result.status === "FAIL") {
    process.exitCode = 1;
  }
} finally {
  await engine.stop();
}
