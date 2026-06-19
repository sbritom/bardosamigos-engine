import { Button } from './Button'

export function Pagination({ page = 1, totalPages = 1, onChange }) {
  return (
    <nav className="bds-pagination" aria-label="Paginacao">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange?.(page - 1)}>Anterior</Button>
      <span>{page} / {totalPages}</span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange?.(page + 1)}>Proxima</Button>
    </nav>
  )
}
