import { radioApiConfig } from "../config";
import { ConfigService } from "./configService";

export const playerService = {
  async getStreamUrl() {
    const config = await ConfigService.getConfig();
    return radioApiConfig.streamUrl || config.data?.streamUrl || config.data?.stream?.publicUrl || "";
  },
};
