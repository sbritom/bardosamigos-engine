import { memo } from "react";
import { BarChart3 } from "lucide-react";

import { formatDuration } from "../radioFormatters";

function StatisticsCard({ state, health }) {
  const stats = health?.stats || {};
  const uptime = stats.uptime || health?.uptime || 0;

  return (
    <section className="bar-radio-card">
      <div className="bar-radio-card-title">
        <BarChart3 size={18} />
        <h3>Estatisticas</h3>
      </div>
      <div className="bar-radio-stats-grid">
        <span>{Number(state.listeners || 0)} ouvintes</span>
        <span>{formatDuration(state.duration)} duracao</span>
        <span>{formatDuration(state.remaining)} restantes</span>
        <span>{uptime ? `${formatDuration(uptime)} online` : "Uptime indisponivel"}</span>
      </div>
    </section>
  );
}

export default memo(StatisticsCard);
