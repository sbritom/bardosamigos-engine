import { Spinner } from './Spinner'

export function Loading({ label = 'Carregando' }) {
  return (
    <div className="bds-loading" role="status" aria-live="polite">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
