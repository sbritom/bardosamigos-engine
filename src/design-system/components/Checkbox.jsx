import { forwardRef } from 'react'

export const Checkbox = forwardRef(function Checkbox({ label, ...props }, ref) {
  return (
    <label className="bds-choice">
      <input ref={ref} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
})
