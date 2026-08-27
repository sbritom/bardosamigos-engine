import { memo } from "react";
import { Activity } from "lucide-react";

import DashboardCard from "./DashboardCard";
import { formatDuration, toneFor } from "../adminFormatters";

function StatusCard({ dashboard, system }) {
  const health = dashboard?.health;
  const status = health?.status || dashboard?.status?.state || "OFFLINE";
  const release = dashboard?.release || system?.version?.release;

  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <Activity size={18} />
        <h2>Status geral</h2>
      </div>
      <div className="radio-admin-metrics">
        <DashboardCard title="Status" value={status} tone={toneFor(status)} />
        <DashboardCard title="CPU" value={`${system?.cpu?.count || 0} cores`} detail={system?.cpu?.model} />
        <DashboardCard title="RAM livre" value={`${Math.round((system?.ram?.free || 0) / 1024 / 1024)} MB`} />
        <DashboardCard title="Tempo online" value={formatDuration(system?.uptime?.process)} />
        <DashboardCard title="Engine Version" value={release?.version || system?.version?.engine?.version || "N/A"} detail={release?.buildNumber || release?.environment} />
      </div>
    </section>
  );
}

export default memo(StatusCard);
