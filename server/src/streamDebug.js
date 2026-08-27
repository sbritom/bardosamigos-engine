process.env.RADIO_USE_MOCKS = process.env.RADIO_USE_MOCKS || "false";
process.env.RADIO_STREAM_ON_START = "true";
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "debug";
process.env.ICECAST_SOURCE_PASSWORD = process.env.ICECAST_SOURCE_PASSWORD || "BarDosAmigos2026!";

await import("./index.js");
