import React from 'react'
import { Skeleton } from '../skeleton.jsx'
import { cn } from '../../../lib/cn.js'

export function RichContentPageSkeleton({
  sectionLabel = '',
  showSubtitle = true,
  sections = 1,
  className,
  contentOnly = false,
}) {
  const content = (
    <div className={cn(contentOnly ? 'space-y-8' : 'container max-w-5xl space-y-8', className)}>
      <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
        {sectionLabel ? (
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">
            {sectionLabel}
          </p>
        ) : null}
        <Skeleton className="h-10 w-56 sm:h-12 sm:w-72" />
        {showSubtitle ? <Skeleton className="h-5 w-full max-w-3xl" /> : null}
      </header>

      {Array.from({ length: Math.max(1, sections) }).map((_, index) => (
        <div
          key={`rich-content-skeleton-${index}`}
          className="rounded-2xl border border-border/70 bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-9 md:px-12"
        >
          <Skeleton className="h-8 w-64 max-w-full" />
          {showSubtitle ? <Skeleton className="mt-3 h-5 w-full max-w-2xl" /> : null}
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-8/12" />
          </div>
        </div>
      ))}
    </div>
  )

  if (contentOnly) {
    return content
  }

  return (
    <section className="bg-background py-10 sm:py-12 lg:py-16">
      {content}
    </section>
  )
}
