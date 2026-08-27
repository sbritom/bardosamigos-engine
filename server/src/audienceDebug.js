import { RadioEngine } from "./core/RadioEngine.js";

const engine = new RadioEngine({
  env: {
    ...process.env,
    RADIO_STREAM_ON_START: "false",
  },
});

await engine.start();
const audience = engine.audience.summary();

console.info("========== AUDIENCE DEBUG ==========");
console.info("Listeners:");
console.info(audience.audience?.current || 0);
console.info("Most Played:");
console.info(audience.mostPlayed?.top10?.length || 0);
console.info("Favorites:");
console.info(Object.keys(audience.favorites?.tracks || {}).length);
console.info("Requests:");
console.info(audience.requests?.items?.length || 0);
console.info("Statistics:");
console.info(JSON.stringify(audience.statistics?.totals || {}, null, 2));
console.info("History:");
console.info(audience.history?.items?.length || 0);
console.info("====================================");

await engine.stop();
