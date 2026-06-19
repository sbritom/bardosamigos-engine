import { classNames } from '../utils'

export function Inline({ children, gap = 'md', className }) {
  return <div className={classNames('bds-inline', `bds-inline--${gap}`, className)}>{children}</div>
}
