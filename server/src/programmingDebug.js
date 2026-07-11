import { RadioEngine } from "./core/RadioEngine.js";

const engine = new RadioEngine({
  env: {
    ...process.env,
    RADIO_STREAM_ON_START: "false",
  },
});

await engine.start();
const scheduler = engine.scheduler?.list?.() || [];
const scheduledItems = Array.isArray(scheduler) ? scheduler.length : Number(scheduler?.items?.length || scheduler?.total || 0);

console.info("========== PROGRAMMING DEBUG ==========");
console.info("Programming Engine:");
console.info(engine.programming ? "READY" : "NOT INSTALLED");
console.info("Scheduler:");
console.info(engine.scheduler?.active ? "ACTIVE" : "INACTIVE");
console.info("Scheduled items:");
console.info(scheduledItems);
console.info("=======================================");

await engine.stop();
