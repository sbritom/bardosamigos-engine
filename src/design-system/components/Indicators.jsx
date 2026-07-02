import { classNames } from '../utils'

export function LiveIndicator({ label = 'AO VIVO', active = true, className }) {
  return (
    <span className={classNames('bds-live-indicator', active && 'bds-live-indicator--active', className)}>
      <span className="bds-live-indicator__dot" aria-hidden="true" />
      {label}
    </span>
  )
}

export function MetricChip({ label, value, icon, className }) {
  return (
    <span className={classNames('bds-metric-chip', className)}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  )
}

export function StatBadge({ label, value, tone = 'neutral', className }) {
  return (
    <span className={classNames('bds-stat-badge', `bds-stat-badge--${tone}`, className)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  )
}
