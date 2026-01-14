import React from 'react'
import { cn } from '../../lib/cn.js'
import { Button } from './button.jsx'

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-danger/30 bg-danger/5 px-6 py-6 text-center',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-danger">{title}</h3>
      {message ? (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      ) : null}
      {(onRetry || secondaryAction) ? (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <Button type="button" variant="danger" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}

export function InlineError({ message, className }) {
  if (!message) {
    return null
  }

  return (
    <p className={cn('text-sm text-danger', className)} role="alert">
      {message}
    </p>
  )
}
