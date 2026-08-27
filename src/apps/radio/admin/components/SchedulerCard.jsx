import { memo } from "react";
import { CalendarClock } from "lucide-react";

function SchedulerCard({ scheduler }) {
  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <CalendarClock size={18} />
        <h2>Scheduler</h2>
      </div>
      <div className="radio-admin-list">
        <span>Ativo <strong>{scheduler?.active ? "SIM" : "NAO"}</strong></span>
        <span>Proxima execucao <strong>{scheduler?.nextRun || "N/A"}</strong></span>
        <span>Ultima execucao <strong>{scheduler?.lastRun || "N/A"}</strong></span>
      </div>
    </section>
  );
}

export default memo(SchedulerCard);
