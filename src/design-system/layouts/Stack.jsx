import { classNames } from '../utils'

export function Stack({ children, gap = 'md', align = 'stretch', className, as: Element = 'div' }) {
  return <Element className={classNames('bds-stack', `bds-stack--${gap}`, `bds-stack--align-${align}`, className)}>{children}</Element>
}
