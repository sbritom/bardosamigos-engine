import { classNames } from '../utils'

export function Grid({ children, columns = 3, className }) {
  return (
    <div className={classNames('bds-grid', className)} style={{ '--bds-grid-columns': columns }}>
      {children}
    </div>
  )
}
