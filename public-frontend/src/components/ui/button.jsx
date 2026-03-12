import React from 'react'
import { cn } from '../../lib/cn.js'

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-[color,background-color,border-color,transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50'

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
  as: Comp = 'button',
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
  const isButton = Comp === 'button'
  const isIconButton = size === 'icon'

  return (
    <Comp
      type={isButton ? type : undefined}
      onClick={onClick}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        loading ? 'cursor-wait' : '',
        isDisabled ? 'hover:translate-y-0 active:scale-100' : '',
        !isButton && isDisabled ? 'pointer-events-none opacity-50' : '',
        className,
      )}
      {...props}
    >
      {isIconButton ? (
        loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          children
        )
      ) : (
        <span className={cn('inline-flex items-center', loading ? 'gap-2' : 'gap-0')}>
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex items-center justify-center rounded-full border-current border-t-transparent transition-[width,height,opacity,border-width] duration-200',
              loading
                ? 'h-4 w-4 animate-spin border-2 opacity-100'
                : 'h-0 w-0 border-0 opacity-0',
            )}
          />
          <span className={cn('whitespace-nowrap', loading ? 'opacity-90' : 'opacity-100')}>
            {children}
          </span>
        </span>
      )}
    </Comp>
  )
}
