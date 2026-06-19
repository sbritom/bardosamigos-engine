import { Button } from './Button'
import { classNames } from '../utils'

export function Drawer({ open, title, children, onClose, side = 'right', className }) {
  if (!open) return null

  return (
    <aside className={classNames('bds-drawer', `bds-drawer--${side}`, className)} aria-label={title}>
      <header className="bds-drawer__header">
        <h2>{title}</h2>
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </header>
      {children}
    </aside>
  )
}
