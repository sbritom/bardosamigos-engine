import { Skeleton } from '../../../design-system'

export function TVLoading({ count = 4 }) {
  return (
    <div className="tv-platform__loading" aria-label="Carregando TV">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="tv-platform__skeleton" />
      ))}
    </div>
  )
}
