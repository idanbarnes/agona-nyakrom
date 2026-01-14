import React from 'react'
import { cn } from '../../lib/cn.js'

const baseStyles =
  'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'

export const Select = React.forwardRef(function Select(
  { className, error, children, ...props },
  ref,
) {
  const isInvalid =
    error || props['aria-invalid'] === true || props['aria-invalid'] === 'true'

  return (
    <select
      ref={ref}
      aria-invalid={isInvalid || undefined}
      className={cn(
        baseStyles,
        isInvalid ? 'border-danger focus-visible:ring-danger' : '',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})
