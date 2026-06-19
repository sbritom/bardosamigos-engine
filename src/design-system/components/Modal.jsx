import { Button } from './Button'
import { classNames } from '../utils'

export function Modal({ open, title, children, onClose, className }) {
  if (!open) return null

  return (
    <div className="bds-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className={classNames('bds-modal__panel', className)}>
        <header className="bds-modal__header">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </header>
        {children}
      </div>
    </div>
  )
}
