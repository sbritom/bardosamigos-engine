import { forwardRef } from 'react'

export const Textarea = forwardRef(function Textarea({ label, id, rows = 4, ...props }, ref) {
  return (
    <label className="bds-field" htmlFor={id}>
      {label && <span>{label}</span>}
      <textarea ref={ref} id={id} rows={rows} {...props} />
    </label>
  )
})
