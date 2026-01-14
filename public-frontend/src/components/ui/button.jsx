import React from 'react'
import { cn } from '../../lib/cn.js'

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50'

const variantStyles = {
  primary:
    'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
  secondary:
    'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
  danger:
    'border-transparent bg-danger text-danger-foreground hover:bg-danger/90',
  ghost:
    'border-transparent bg-transparent text-foreground hover:bg-accent',
}

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'h-10 w-10',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
  children,
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        loading ? 'cursor-wait' : '',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span className="whitespace-nowrap">{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
