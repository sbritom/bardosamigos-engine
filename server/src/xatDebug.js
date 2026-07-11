import { RadioEngine } from "./core/RadioEngine.js";

const engine = new RadioEngine({
  env: {
    ...process.env,
    RADIO_STREAM_ON_START: "false",
  },
});

await engine.start();

const config = engine.xat.getConfig();
const status = engine.xat.status();
const stream = engine.xat.stream();
const widget = engine.xat.widget();
const nowPlaying = engine.player.getState().currentTrack;

console.info("========== XAT DEBUG ==========");
console.info("Host:");
console.info(config.host);
console.info("Port:");
console.info(config.port);
console.info("Mount:");
console.info(config.mount);
console.info("Stream URL:");
console.info(stream.url);
console.info("Codigo radiohtml5:");
console.info(stream.radioHtml5);
console.info("Status:");
console.info(status.status);
console.info("Now Playing:");
console.info(nowPlaying ? `${nowPlaying.title} - ${nowPlaying.artist}` : "N/A");
console.info("Widget:");
console.info(widget ? "OK" : "N/A");
console.info("================================");

await engine.stop();
