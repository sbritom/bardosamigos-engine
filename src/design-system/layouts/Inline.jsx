import { classNames } from '../utils'

export function Inline({ children, gap = 'md', align = 'center', justify = 'start', wrap = true, className, as: Element = 'div' }) {
  return (
    <Element className={classNames('bds-inline', `bds-inline--${gap}`, `bds-inline--align-${align}`, `bds-inline--justify-${justify}`, wrap && 'bds-inline--wrap', className)}>
      {children}
    </Element>
  )
}
