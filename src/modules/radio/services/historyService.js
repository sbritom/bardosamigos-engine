import { MetadataService } from "./metadataService";

export const historyService = {
  getHistory(options) {
    return MetadataService.getHistory(options);
  },
};
