export function ProgressCircle({ value = 0, label }) {
  const normalizedValue = Math.min(Math.max(value, 0), 100)

  return (
    <div className="bds-progress-circle" role="progressbar" aria-valuenow={normalizedValue} aria-valuemin="0" aria-valuemax="100">
      <span>{label || `${normalizedValue}%`}</span>
    </div>
  )
}
