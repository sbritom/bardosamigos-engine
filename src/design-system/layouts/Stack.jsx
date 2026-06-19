import { classNames } from '../utils'

export function Stack({ children, gap = 'md', className }) {
  return <div className={classNames('bds-stack', `bds-stack--${gap}`, className)}>{children}</div>
}
