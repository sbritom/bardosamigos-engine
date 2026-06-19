import { forwardRef } from 'react'

export const Input = forwardRef(function Input({ label, id, ...props }, ref) {
  return (
    <label className="bds-field" htmlFor={id}>
      {label && <span>{label}</span>}
      <input ref={ref} id={id} {...props} />
    </label>
  )
})
