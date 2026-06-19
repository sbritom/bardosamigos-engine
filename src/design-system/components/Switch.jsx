import { forwardRef } from 'react'

export const Switch = forwardRef(function Switch({ label, ...props }, ref) {
  return (
    <label className="bds-switch">
      <input ref={ref} type="checkbox" role="switch" {...props} />
      <span>{label}</span>
    </label>
  )
})
