import { Badge, Button } from '../../../../design-system'

export function CompetitionDataTable({ columns, rows, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--bds-color-border)] bg-[var(--bds-color-background)] text-[var(--bds-color-text-secondary)]">
            <tr>
              {columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--bds-color-border)] last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="max-w-[260px] truncate px-4 py-3">
                    {column.key === 'status' ? <Badge>{row[column.key]}</Badge> : row[column.key] || '-'}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => onEdit(row)}>Editar</Button>
                    <Button variant="danger" onClick={() => onDelete(row)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
