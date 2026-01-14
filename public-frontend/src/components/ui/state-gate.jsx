import React from 'react'
import { EmptyState } from './empty-state.jsx'
import { ErrorState } from './error-state.jsx'
import { ListSkeleton } from './skeletons/list-skeleton.jsx'

function resolveErrorMessage(error) {
  if (!error) {
    return ''
  }

  if (typeof error === 'string') {
    return error
  }

  if (error?.message) {
    return error.message
  }

  try {
    return JSON.stringify(error)
  } catch (resolveError) {
    return 'Something went wrong.'
  }
}

export function StateGate({
  loading,
  error,
  isEmpty,
  skeleton,
  empty,
  errorFallback,
  children,
}) {
  // State precedence: loading -> error -> empty -> content.
  if (loading) {
    return skeleton || <ListSkeleton />
  }

  if (error) {
    return (
      errorFallback || <ErrorState message={resolveErrorMessage(error)} />
    )
  }

  if (isEmpty) {
    return empty || <EmptyState title="Nothing here yet" />
  }

  return <>{children}</>
}
