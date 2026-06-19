export function Tooltip({ children, content }) {
  return (
    <span className="bds-tooltip" data-tooltip={content}>
      {children}
    </span>
  )
}
