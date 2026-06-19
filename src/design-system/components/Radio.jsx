import { forwardRef } from 'react'

export const Radio = forwardRef(function Radio({ label, ...props }, ref) {
  return (
    <label className="bds-choice">
      <input ref={ref} type="radio" {...props} />
      <span>{label}</span>
    </label>
  )
})
