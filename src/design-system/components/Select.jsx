import { forwardRef } from 'react'

export const Select = forwardRef(function Select({ label, options = [], id, ...props }, ref) {
  return (
    <label className="bds-field" htmlFor={id}>
      {label && <span>{label}</span>}
      <select ref={ref} id={id} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
})
