import React, { useMemo, useState } from 'react'
import { cn } from '../../lib/cn.js'

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackSrc,
  fallbackText = 'Image unavailable',
  ...props
}) {
  const [hasError, setHasError] = useState(false)
  const resolvedSrc = hasError ? fallbackSrc : src
  const showPlaceholder = !resolvedSrc

  const placeholderLabel = useMemo(() => {
    if (alt) {
      return alt
    }

    return fallbackText
  }, [alt, fallbackText])

  if (showPlaceholder) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed border-border bg-muted text-sm text-muted-foreground',
          className,
        )}
      >
        {placeholderLabel}
      </div>
    )
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  )
}
