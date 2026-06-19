import { forwardRef } from 'react'
import { classNames } from '../utils'

export const Button = forwardRef(function Button(
  { children, className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classNames('bds-button', `bds-button--${variant}`, `bds-button--${size}`, className)}
      {...props}
    >
      {children}
    </button>
  )
})
