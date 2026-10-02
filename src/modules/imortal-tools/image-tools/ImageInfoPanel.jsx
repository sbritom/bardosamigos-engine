export default function ImageInfoPanel({ items = [], footer, className = '' }) {
  const visibleItems = items.filter((item) => item?.value !== undefined && item?.value !== null && item?.value !== '')
  if (!visibleItems.length && !footer) return null

  return (
    <div className={`bds-image-info-panel ${className}`.trim()}>
      {visibleItems.length > 0 && (
        <dl>
          {visibleItems.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd title={typeof item.value === 'string' ? item.value : undefined}>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {footer && <div className="bds-image-info-panel__footer">{footer}</div>}
    </div>
  )
}

