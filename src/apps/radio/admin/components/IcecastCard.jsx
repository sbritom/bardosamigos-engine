import { memo } from "react";
import { RadioTower } from "lucide-react";

function IcecastCard({ icecast }) {
  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <RadioTower size={18} />
        <h2>Icecast</h2>
      </div>
      <div className="radio-admin-list">
        <span>Status <strong>{icecast?.connected || icecast?.mountActive ? "ONLINE" : "OFFLINE"}</strong></span>
        <span>Host <strong>{icecast?.host || "N/A"}</strong></span>
        <span>Porta <strong>{icecast?.port || "N/A"}</strong></span>
        <span>Mount <strong>{icecast?.mount || "/radio"}</strong></span>
        <span>Listeners <strong>{icecast?.listeners || icecast?.lastDebug?.listeners || 0}</strong></span>
      </div>
    </section>
  );
}

export default memo(IcecastCard);
