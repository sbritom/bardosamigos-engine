import { AlertTriangle } from 'lucide-react'
import { classNames } from '../utils'
import { ActionButton } from './ActionButton'
import { Skeleton } from './Skeleton'

export function LoadingSkeleton({ rows = 3, className }) {
  return (
    <div className={classNames('bds-loading-skeleton', className)} role="status" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={index === 0 ? 24 : 16} />
      ))}
    </div>
  )
}

export function ErrorState({ title = 'Algo deu errado', description, actionLabel, onAction, className }) {
  return (
    <div className={classNames('bds-error-state', className)} role="alert">
      <AlertTriangle size={24} />
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actionLabel && <ActionButton variant="outline" onClick={onAction}>{actionLabel}</ActionButton>}
    </div>
  )
}
