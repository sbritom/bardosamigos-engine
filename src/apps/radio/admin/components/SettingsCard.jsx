import { memo } from "react";
import { Settings } from "lucide-react";

function SettingsCard({ config }) {
  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <Settings size={18} />
        <h2>Configuracoes</h2>
      </div>
      <div className="radio-admin-list">
        <span>Host <strong>{config?.host || "N/A"}</strong></span>
        <span>Porta <strong>{config?.port || "N/A"}</strong></span>
        <span>Mount <strong>{config?.mount || "N/A"}</strong></span>
        <span>Bitrate <strong>{config?.bitrate || "N/A"}</strong></span>
        <span>Codec <strong>{config?.codec || "N/A"}</strong></span>
        <span>Shuffle <strong>{config?.shuffle ? "SIM" : "NAO"}</strong></span>
        <span>Repeat <strong>{config?.repeat ? "SIM" : "NAO"}</strong></span>
        <span>Watcher <strong>{config?.watcher?.online ? "ONLINE" : "OFFLINE"}</strong></span>
      </div>
    </section>
  );
}

export default memo(SettingsCard);
