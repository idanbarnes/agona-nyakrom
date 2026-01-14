import React from 'react'
import { cn } from '../../../lib/cn.js'
import { Skeleton } from '../skeleton.jsx'

export function ListSkeleton({ rows = 5, showAvatar = false, className }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`list-skeleton-${index}`}
          className="flex items-start gap-4"
        >
          {showAvatar ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : null}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}
