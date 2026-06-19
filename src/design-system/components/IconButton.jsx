import { forwardRef } from 'react'
import { classNames } from '../utils'

export const IconButton = forwardRef(function IconButton(
  { icon, label, className, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} aria-label={label} title={label} className={classNames('bds-icon-button', className)} {...props}>
      {icon}
    </button>
  )
})
