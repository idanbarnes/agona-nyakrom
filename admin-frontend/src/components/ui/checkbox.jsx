import React from 'react'
import { cn } from '../../lib/cn.js'

const baseStyles =
  'h-4 w-4 rounded border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'

export const Checkbox = React.forwardRef(function Checkbox(
  { className, onCheckedChange, onChange, ...props },
  ref,
) {
  const handleChange = (event) => {
    onChange?.(event)
    onCheckedChange?.(event.target.checked)
  }

  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(baseStyles, className)}
      onChange={handleChange}
      {...props}
    />
  )
})
