export function Table({ columns = [], rows = [], getRowKey = (_, index) => index }) {
  return (
    <table className="bds-table">
      <thead>
        <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={getRowKey(row, index)}>
            {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
