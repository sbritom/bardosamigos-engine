import { classNames } from '../utils'

export function Chip({ children, selected = false, className, ...props }) {
  return (
    <span className={classNames('bds-chip', selected && 'bds-chip--selected', className)} {...props}>
      {children}
    </span>
  )
}
