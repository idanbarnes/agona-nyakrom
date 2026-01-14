import React from 'react'
import { cn } from '../../lib/cn.js'
import { Button } from './button.jsx'

const getPageNumbers = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set([1, totalPages])
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  for (let i = start; i <= end; i += 1) {
    pages.add(i)
  }

  return Array.from(pages).sort((a, b) => a - b)
}

export function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) {
    return null
  }

  const pages = getPageNumbers(page, totalPages)

  return (
    <nav
      className={cn('flex items-center justify-center gap-2', className)}
      aria-label="Pagination"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Go to previous page"
      >
        Prev
      </Button>
      {pages.map((pageNumber, index) => {
        const previous = pages[index - 1]
        const showEllipsis = previous && pageNumber - previous > 1

        return (
          <React.Fragment key={pageNumber}>
            {showEllipsis ? (
              <span className="px-2 text-sm text-muted-foreground">…</span>
            ) : null}
            <Button
              variant={pageNumber === page ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onChange(pageNumber)}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          </React.Fragment>
        )
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Go to next page"
      >
        Next
      </Button>
    </nav>
  )
}
