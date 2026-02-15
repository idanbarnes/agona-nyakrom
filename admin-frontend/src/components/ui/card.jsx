import React from 'react'
import { cn } from '../../lib/cn.js'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white text-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-5 pb-0 sm:p-6 sm:pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold leading-tight', className)} {...props} />
  )
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-4 sm:p-6 sm:pt-4', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 p-5 pt-0 sm:p-6 sm:pt-0', className)}
      {...props}
    />
  )
}
