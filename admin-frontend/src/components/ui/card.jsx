import React from 'react'
import { cn } from '../../lib/cn.js'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface text-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-6 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none', className)} {...props} />
  )
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-4', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 p-6 pt-0', className)}
      {...props}
    />
  )
}
