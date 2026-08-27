import { classNames } from '../utils'

export function Divider({ orientation = 'horizontal', className }) {
  return <hr className={classNames('bds-divider', `bds-divider--${orientation}`, className)} aria-orientation={orientation} />
}
