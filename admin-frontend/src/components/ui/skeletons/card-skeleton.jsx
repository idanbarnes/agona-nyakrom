import React from 'react'
import { cn } from '../../../lib/cn.js'
import { Skeleton } from '../skeleton.jsx'

export function CardSkeleton({ className }) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-4', className)}>
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}
