import { classNames } from '../utils'

export function Badge({ children, tone = 'neutral', className }) {
  return <span className={classNames('bds-badge', `bds-badge--${tone}`, className)}>{children}</span>
}
