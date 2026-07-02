import { classNames } from '../utils'

export function Panel({ children, className, as: Element = 'section', elevated = false, ...props }) {
  return (
    <Element
      className={classNames('bds-panel', elevated && 'bds-panel--elevated', className)}
      {...props}
    >
      {children}
    </Element>
  )
}
