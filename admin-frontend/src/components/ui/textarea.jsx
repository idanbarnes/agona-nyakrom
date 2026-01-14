import React from 'react'
import { cn } from '../../lib/cn.js'

const baseStyles =
  'flex min-h-[96px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'

export const Textarea = React.forwardRef(function Textarea(
  { className, error, ...props },
  ref,
) {
  const isInvalid =
    error || props['aria-invalid'] === true || props['aria-invalid'] === 'true'

  return (
    <textarea
      ref={ref}
      aria-invalid={isInvalid || undefined}
      className={cn(
        baseStyles,
        isInvalid ? 'border-danger focus-visible:ring-danger' : '',
        className,
      )}
      {...props}
    />
  )
})
