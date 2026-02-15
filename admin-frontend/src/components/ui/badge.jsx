import React from 'react'
import { cn } from '../../lib/cn.js'

const variantStyles = {
  default: 'bg-accent text-accent-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  muted: 'bg-muted text-muted-foreground',
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-slate-100 text-slate-700',
}

export function Badge({ variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  )
}
