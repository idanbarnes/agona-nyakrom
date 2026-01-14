import React from 'react'
import { cn } from '../../../lib/cn.js'
import { Skeleton } from '../skeleton.jsx'

export function TableSkeleton({ rows = 6, columns = 5, className }) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface', className)}>
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex gap-3">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`table-head-${index}`} className="h-3 w-full" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`table-row-${rowIndex}`} className="flex gap-3 px-4 py-3">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton
                key={`table-cell-${rowIndex}-${colIndex}`}
                className="h-4 w-full"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
