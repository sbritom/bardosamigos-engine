export function Progress({ value = 0, max = 100, label }) {
  const normalizedValue = Math.min(Math.max(value, 0), max)

  return (
    <div className="bds-progress">
      {label && <span>{label}</span>}
      <progress value={normalizedValue} max={max} />
    </div>
  )
}
