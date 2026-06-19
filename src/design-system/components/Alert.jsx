import { classNames } from '../utils'

export function Alert({ children, status = 'info', title }) {
  return (
    <div className={classNames('bds-alert', `bds-alert--${status}`)} role="alert">
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  )
}
