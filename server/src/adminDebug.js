import { RadioEngine } from "./core/RadioEngine.js";
import { RadioAdminApi } from "./admin/RadioAdminApi.js";

const engine = new RadioEngine({
  env: {
    ...process.env,
    RADIO_STREAM_ON_START: "false",
  },
});

await engine.start();
const admin = new RadioAdminApi(engine);
const dashboard = admin.dashboard();

console.info("========== ADMIN DEBUG ==========");
console.info("Status:");
console.info(dashboard.health?.status || dashboard.status?.state || "N/A");
console.info("API:");
console.info(dashboard.status?.apiPort || "N/A");
console.info("Player:");
console.info(dashboard.player?.status || "N/A");
console.info("Biblioteca:");
console.info(dashboard.library?.totalTracks || 0);
console.info("Queue:");
console.info((dashboard.queue?.playlistQueue?.length || 0) + (dashboard.queue?.audioQueue?.length || 0));
console.info("Health:");
console.info(dashboard.health?.health || "N/A");
console.info("=================================");

await engine.stop();
