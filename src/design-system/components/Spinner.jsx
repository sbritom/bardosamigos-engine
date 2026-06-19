import { classNames } from '../utils'

export function Spinner({ label = 'Carregando', className }) {
  return <span className={classNames('bds-spinner', className)} role="status" aria-label={label} />
}
