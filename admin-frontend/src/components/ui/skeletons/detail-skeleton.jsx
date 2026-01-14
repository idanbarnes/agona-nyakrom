import React from 'react'
import { cn } from '../../../lib/cn.js'
import { Skeleton } from '../skeleton.jsx'

export function DetailSkeleton({ className }) {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}
