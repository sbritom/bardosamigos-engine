import { memo } from "react";
import { Activity } from "lucide-react";

function StatusWidget({ status }) {
  const value = String(status?.status || status || "offline").toUpperCase();
  const tone = ["PLAYING", "ONLINE"].includes(value) ? "is-online" : value === "BUFFERING" ? "is-buffering" : "is-offline";

  return (
    <section className="bar-radio-card bar-xat-panel">
      <div className="bar-radio-card-title">
        <Activity size={18} />
        <h3>Status xat</h3>
      </div>
      <div className="bar-xat-panel-content">
        <span className={`bar-xat-status ${tone}`}>{value}</span>
      </div>
    </section>
  );
}

export default memo(StatusWidget);
