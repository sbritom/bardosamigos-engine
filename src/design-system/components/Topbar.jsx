import { classNames } from '../utils'

export function Topbar({ children, className }) {
  return <header className={classNames('bds-topbar', className)}>{children}</header>
}
