import { RadioEngine } from "./core/RadioEngine.js";

const engine = new RadioEngine({
  env: {
    ...process.env,
    RADIO_STREAM_ON_START: "false",
  },
});

await engine.start();
const state = engine.player.getState();

console.info("========== PLAYER DEBUG ==========");
console.info("Track:");
console.info(state.currentTrack?.title || "N/A");
console.info("Artista:");
console.info(state.currentTrack?.artist || "N/A");
console.info("Album:");
console.info(state.currentTrack?.album || "N/A");
console.info("Status:");
console.info(state.status);
console.info("Elapsed:");
console.info(state.elapsed);
console.info("Remaining:");
console.info(state.remaining);
console.info("Volume:");
console.info(state.volume);
console.info("Listeners:");
console.info(state.listeners);
console.info("Cover:");
console.info(state.cover?.original || state.cover?.fallback || "N/A");
console.info("API:");
console.info("/engine/player/state");
console.info("==================================");

await engine.stop();
