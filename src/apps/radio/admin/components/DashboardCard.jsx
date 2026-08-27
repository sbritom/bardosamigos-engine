import { memo } from "react";

function DashboardCard({ title, value, detail, tone = "neutral" }) {
  return (
    <section className={`radio-admin-card radio-admin-card--${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </section>
  );
}

export default memo(DashboardCard);
