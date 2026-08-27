import { classNames } from '../utils'

export function ResponsiveContainer({ children, size = 'xl', className, as: Element = 'div' }) {
  return <Element className={classNames('bds-responsive-container', `bds-responsive-container--${size}`, className)}>{children}</Element>
}
