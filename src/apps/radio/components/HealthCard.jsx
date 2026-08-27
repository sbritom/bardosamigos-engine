import { memo } from "react";
import { ShieldCheck } from "lucide-react";

function HealthCard({ health, error }) {
  const status = health?.status || health?.overall || (error ? "degraded" : "monitoring");

  return (
    <section className="bar-radio-card">
      <div className="bar-radio-card-title">
        <ShieldCheck size={18} />
        <h3>Health</h3>
      </div>
      <p className="bar-radio-health-status">{String(status).toUpperCase()}</p>
      <span>{error || "Radio API monitorada por polling inteligente."}</span>
    </section>
  );
}

export default memo(HealthCard);
