import React from 'react'
import { cn } from '../../lib/cn.js'

export function Table({ className, ...props }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table
        className={cn('w-full text-sm text-foreground', className)}
        {...props}
      />
    </div>
  )
}

export function TableToolbar({ left, right, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

export function TableHead({ className, ...props }) {
  return (
    <thead
      className={cn('bg-muted/40 text-xs uppercase text-muted-foreground', className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn('divide-y divide-border', className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn('transition-colors hover:bg-accent/50', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }) {
  return (
    <td className={cn('px-4 py-3 align-middle', className)} {...props} />
  )
}

export function TableEmptyState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export function TableLoading({ rows = 3, columns = 4 }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 flex-1 animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
