import { classNames } from '../utils'

export function Skeleton({ width = '100%', height = 16, className }) {
  return <span className={classNames('bds-skeleton', className)} style={{ width, height }} aria-hidden="true" />
}
