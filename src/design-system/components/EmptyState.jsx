import { Button } from './Button'

export function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <div className="bds-empty-state">
      {icon}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
