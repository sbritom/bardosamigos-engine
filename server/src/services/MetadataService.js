import { normalizeMetadata, parseStreamTitle } from "../utils/metadataParser.js";

export const MetadataService = {
  parse(metadata) {
    return typeof metadata === "string" ? parseStreamTitle(metadata) : normalizeMetadata(metadata);
  },
};
