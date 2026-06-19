export function Icon({ children, label, size = 20 }) {
  return (
    <span className="bds-icon" aria-label={label} aria-hidden={label ? undefined : true} style={{ width: size, height: size }}>
      {children}
    </span>
  )
}
