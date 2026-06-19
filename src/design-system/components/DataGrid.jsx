import { Table } from './Table'

export function DataGrid({ columns, rows, emptyMessage = 'Nenhum registro encontrado.', ...props }) {
  if (!rows?.length) {
    return <div className="bds-data-grid__empty">{emptyMessage}</div>
  }

  return <Table columns={columns} rows={rows} {...props} />
}
