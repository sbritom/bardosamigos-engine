import { classNames } from '../utils'

export function Sidebar({ children, className, label = 'Navegacao lateral' }) {
  return (
    <aside className={classNames('bds-sidebar', className)} aria-label={label}>
      {children}
    </aside>
  )
}
