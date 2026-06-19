import { classNames } from '../utils'

export function Card({ children, className, as: Element = 'section', ...props }) {
  return (
    <Element className={classNames('bds-card', className)} {...props}>
      {children}
    </Element>
  )
}
