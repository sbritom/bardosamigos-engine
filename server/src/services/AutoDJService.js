import { radioConfig } from "../config/radioConfig.js";

export const AutoDJService = {
  getStatus() {
    return {
      enabled: radioConfig.autoDjEnabled,
      implemented: false,
      message: "AutoDJ real sera implementado na Sprint 3.",
    };
  },
};
