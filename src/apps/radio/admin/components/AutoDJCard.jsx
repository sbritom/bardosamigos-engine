import { memo } from "react";
import { Shuffle } from "lucide-react";

function AutoDJCard({ autodj }) {
  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <Shuffle size={18} />
        <h2>AutoDJ</h2>
      </div>
      <div className="radio-admin-list">
        <span>Ativo <strong>{autodj?.active ? "SIM" : "NAO"}</strong></span>
        <span>Modo <strong>{autodj?.mode || "auto"}</strong></span>
        <span>Shuffle <strong>{autodj?.shuffle ? "SIM" : "NAO"}</strong></span>
        <span>Repeat <strong>{autodj?.repeat ? "SIM" : "NAO"}</strong></span>
        <span>Blacklist <strong>{autodj?.blacklist?.length || 0}</strong></span>
      </div>
    </section>
  );
}

export default memo(AutoDJCard);
