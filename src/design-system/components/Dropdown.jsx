import { Button } from './Button'

export function Dropdown({ label, items = [], onSelect }) {
  return (
    <div className="bds-dropdown">
      <Button variant="secondary">{label}</Button>
      <div className="bds-dropdown__menu" role="menu">
        {items.map((item) => (
          <button key={item.value} type="button" role="menuitem" onClick={() => onSelect?.(item.value)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
