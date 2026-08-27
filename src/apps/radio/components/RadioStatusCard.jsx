import { memo } from "react";
import { Activity } from "lucide-react";

import { getStatusTone } from "../radioFormatters";

const STATUS_ITEMS = [
  ["Icecast", "icecast"],
  ["FFmpeg", "ffmpeg"],
  ["AutoDJ", "autodj"],
  ["Scheduler", "scheduler"],
  ["Player", "player"],
  ["Metadata", "metadata"],
  ["Cover", "cover"],
  ["Library", "library"],
  ["API", "api"],
];

function RadioStatusCard({ status, health }) {
  return (
    <section className="bar-radio-card">
      <div className="bar-radio-card-title">
        <Activity size={18} />
        <h3>Status</h3>
      </div>
      <div className="bar-radio-status-grid">
        {STATUS_ITEMS.map(([label, key]) => {
          const value = status?.[key] || health?.modules?.[key]?.status || health?.[key]?.status || "unknown";
          const tone = getStatusTone(value);
          return (
            <div className="bar-radio-status-item" key={key}>
              <span className={`bar-radio-dot is-${tone}`} />
              <span>{label}</span>
              <strong>{String(value).toUpperCase()}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default memo(RadioStatusCard);
