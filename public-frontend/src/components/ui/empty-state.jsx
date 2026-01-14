import React from 'react'
import { cn } from '../../lib/cn.js'

export function EmptyState({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
