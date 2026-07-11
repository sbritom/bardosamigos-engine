import { DeployEngine } from "./deploy/DeployEngine.js";
import { RadioEngine } from "./core/RadioEngine.js";

const command = process.argv[2] || "check";
const needsRadio = ["health", "status", "check"].includes(command);

let radioEngine = null;
if (needsRadio) {
  radioEngine = new RadioEngine({
    env: {
      ...process.env,
      RADIO_STREAM_ON_START: "false",
    },
  });
  await radioEngine.start();
}

const deploy = new DeployEngine({
  radioEngine,
  logger: radioEngine?.logger || null,
});

function printJson(payload) {
  console.info(JSON.stringify(payload, null, 2));
}

try {
  if (command === "backup") {
    printJson(deploy.createBackup());
  } else if (command === "version") {
    printJson(deploy.version());
  } else if (command === "services") {
    printJson(deploy.services());
  } else if (command === "health" || command === "status") {
    const status = deploy.status();
    printJson(status);
    if (status.deploy === "FAIL") process.exitCode = 1;
  } else {
    printJson(deploy.check());
  }
} finally {
  await radioEngine?.stop();
}
