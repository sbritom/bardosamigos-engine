import { ConfigEngine } from "./config/ConfigEngine.js";
import { LoggerEngine } from "./logger/LoggerEngine.js";
import { NetworkDiagnostics } from "./network/NetworkDiagnostics.js";

const config = new ConfigEngine(process.env).load();
const logger = new LoggerEngine(config);
logger.init();

const diagnostics = new NetworkDiagnostics(config, logger);
const result = await diagnostics.run();
diagnostics.print(result);
