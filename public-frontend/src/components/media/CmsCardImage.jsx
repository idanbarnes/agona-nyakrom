import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

const RATIO_MAP = {
  '1/1': '1 / 1',
  '3/2': '3 / 2',
  '4/5': '4 / 5',
  '16/9': '16 / 9',
}

function getAspectRatio(ratio) {
  if (!ratio) {
    return RATIO_MAP['4/5']
  }

  if (RATIO_MAP[ratio]) {
    return RATIO_MAP[ratio]
  }

  if (/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(ratio)) {
    return ratio
  }

  return RATIO_MAP['4/5']
}

export function CmsCardImage({
  src,
  alt,
  ratio = '4/5',
  className,
  imgClassName,
  sizes,
  priority = false,
}) {
  const [hasError, setHasError] = useState(false)

  const normalizedSrc = useMemo(() => {
    if (!src || hasError) {
      return ''
    }

    return resolveAssetUrl(src)
  }, [src, hasError])

  const resolvedAlt = alt?.trim() || 'Card image'
  const aspectRatio = getAspectRatio(ratio)

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-md bg-muted',
        className,
      )}
      style={{ aspectRatio }}
    >
      {normalizedSrc ? (
        <img
          src={normalizedSrc}
          alt={resolvedAlt}
          className={cn('h-full w-full object-cover', imgClassName)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          No image available
        </div>
      )}
    </div>
  )
}

export default CmsCardImage
