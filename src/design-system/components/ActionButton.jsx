import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { classNames } from '../utils'

export const ActionButton = forwardRef(function ActionButton(
  { children, className, variant = 'primary', loading = false, disabled = false, icon, type = 'button', ...props },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      className={classNames('bds-action-button', `bds-action-button--${variant}`, loading && 'bds-action-button--loading', className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="bds-action-button__spinner" size={16} /> : icon}
      <span>{children}</span>
    </button>
  )
})
