import { Card } from './Card'

export function StatCard({ label, value, hint, icon, trend }) {
  return (
    <Card className="bds-stat-card">
      <div className="bds-stat-card__header">
        <span>{label}</span>
        {icon}
      </div>
      <strong className="bds-stat-card__value">{value}</strong>
      {(hint || trend) && <small className="bds-stat-card__hint">{trend || hint}</small>}
    </Card>
  )
}
