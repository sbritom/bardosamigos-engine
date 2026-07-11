import { memo } from "react";
import { ShieldCheck } from "lucide-react";

function HealthCard({ health }) {
  const modules = Object.values(health?.modules || {});

  return (
    <section className="radio-admin-panel">
      <div className="radio-admin-panel-title">
        <ShieldCheck size={18} />
        <h2>Health</h2>
      </div>
      <div className="radio-admin-health-grid">
        {modules.slice(0, 12).map((item) => (
          <span key={item.name} className={`radio-admin-health radio-admin-health--${String(item.status).toLowerCase()}`}>
            {item.name}: {item.status}
          </span>
        ))}
      </div>
    </section>
  );
}

export default memo(HealthCard);
