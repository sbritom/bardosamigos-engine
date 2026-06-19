export function Breadcrumb({ items = [] }) {
  return (
    <nav className="bds-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.href || item.label}>
          {item.href ? <a href={item.href}>{item.label}</a> : item.label}
          {index < items.length - 1 && <span aria-hidden="true">/</span>}
        </span>
      ))}
    </nav>
  )
}
