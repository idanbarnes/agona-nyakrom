import React from 'react'
import { cn } from '../../lib/cn.js'
import { Button } from './button.jsx'

function ChevronLeftIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function MoreHorizontalIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 1) {
    return [1]
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pageItems = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) {
    pageItems.push('ellipsis-start')
  }

  for (let nextPage = start; nextPage <= end; nextPage += 1) {
    pageItems.push(nextPage)
  }

  if (end < totalPages - 1) {
    pageItems.push('ellipsis-end')
  }

  pageItems.push(totalPages)
  return pageItems
}

export function Pagination({ className, ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

export function PaginationContent({ className, ...props }) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

export function PaginationItem(props) {
  return <li data-slot="pagination-item" {...props} />
}

export function PaginationLink({
  className,
  isActive = false,
  size = 'icon',
  children,
  ...props
}) {
  const sizeClassName =
    size === 'default'
      ? 'h-9 px-4 text-sm'
      : 'h-9 w-9 px-0 text-sm'

  return (
    <Button
      type="button"
      variant={isActive ? 'secondary' : 'ghost'}
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive || undefined}
      className={cn(
        sizeClassName,
        'rounded-md',
        isActive ? 'border-border bg-white shadow-sm' : '',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export function PaginationPrevious({ className, ...props }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

export function PaginationNext({ className, ...props }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

export function PaginationEllipsis({ className, ...props }) {
  return (
    <span
      aria-hidden="true"
      data-slot="pagination-ellipsis"
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export function PaginationControls({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) {
    return null
  }

  const pageItems = buildPageItems(page, totalPages)

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
          />
        </PaginationItem>

        {pageItems.map((pageItem) => {
          if (typeof pageItem === 'string') {
            return (
              <PaginationItem key={pageItem}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          return (
            <PaginationItem key={pageItem}>
              <PaginationLink
                isActive={pageItem === page}
                onClick={() => onChange(pageItem)}
              >
                {pageItem}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        <PaginationItem>
          <PaginationNext
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export function TableEntriesSummary({ totalEntries = 0, className }) {
  const resolvedTotalEntries = Number.isFinite(Number(totalEntries))
    ? Number(totalEntries)
    : 0

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      Total Entries: {resolvedTotalEntries}
    </p>
  )
}

export function TablePaginationFooter({
  page = 1,
  totalPages = 1,
  onChange,
  className,
  pageCountClassName,
  paginationClassName,
}) {
  const resolvedTotalPages = Math.max(1, Number(totalPages) || 1)
  const resolvedPage = Math.min(Math.max(1, Number(page) || 1), resolvedTotalPages)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p
        className={cn(
          'text-sm text-muted-foreground whitespace-nowrap',
          pageCountClassName,
        )}
      >
        Page {resolvedPage} of {resolvedTotalPages}
      </p>
      <PaginationControls
        page={resolvedPage}
        totalPages={resolvedTotalPages}
        onChange={onChange}
        className={cn('pt-1 sm:pt-0 sm:justify-end', paginationClassName)}
      />
    </div>
  )
}
