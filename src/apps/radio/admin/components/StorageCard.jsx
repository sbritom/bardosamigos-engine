import { memo } from "react";
import { HardDrive } from "lucide-react";

import { formatBytes } from "../adminFormatters";

function StorageCard({ storage }) {
  const sizes = storage?.sizes || {};

  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <HardDrive size={18} />
        <h2>Storage</h2>
      </div>
      <div className="radio-admin-list">
        <span>Biblioteca <strong>{formatBytes(sizes.library)}</strong></span>
        <span>Cache <strong>{formatBytes(sizes.cache)}</strong></span>
        <span>Capas <strong>{formatBytes(sizes.covers)}</strong></span>
        <span>Miniaturas <strong>{formatBytes(sizes.thumbs)}</strong></span>
        <span>Logs <strong>{formatBytes(sizes.logs)}</strong></span>
      </div>
    </section>
  );
}

export default memo(StorageCard);
