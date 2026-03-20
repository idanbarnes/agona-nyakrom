import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { buildApiUrl } from '../../lib/apiClient.js'
import { Button, ImageWithFallback } from '../../components/ui/index.jsx'

const resolveImageUrl = (value) => {
  const rawPath = String(value || '').trim()
  if (!rawPath) {
    return ''
  }

  if (/^(https?:|data:image\/|blob:)/i.test(rawPath)) {
    return rawPath
  }

  if (/^\/\//.test(rawPath)) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${rawPath}`
    }

    return `https:${rawPath}`
  }

  return buildApiUrl(rawPath.startsWith('/') ? rawPath : `/${rawPath}`)
}

export default function WhoWeAreGalleryImagePreview({
  file = null,
  imageUrl = '',
  altText = '',
  label = 'Current image',
}) {
  const [filePreviewUrl, setFilePreviewUrl] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const closeButtonRef = useRef(null)
  const lastActiveRef = useRef(null)

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(file)
    setFilePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const previewUrl = useMemo(() => {
    if (filePreviewUrl) {
      return filePreviewUrl
    }

    return resolveImageUrl(imageUrl)
  }, [filePreviewUrl, imageUrl])

  const resolvedAltText = altText?.trim() || 'Who We Are gallery image preview'

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    lastActiveRef.current = document.activeElement
    setIsLoading(true)
    setHasError(false)

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(timer)
      lastActiveRef.current?.focus?.()
    }
  }, [isOpen, previewUrl])

  if (!previewUrl) {
    return null
  }

  return (
    <>
      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setIsOpen(true)}
          >
            View
          </button>
        </div>
        <button
          type="button"
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setIsOpen(true)}
          aria-label={`Preview ${resolvedAltText}`}
        >
          <ImageWithFallback
            src={previewUrl}
            alt={resolvedAltText}
            className="h-24 w-32 rounded-lg object-cover"
            fallbackText="Preview unavailable"
          />
        </button>
      </div>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/70"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Image preview"
                className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
                  <p className="text-base font-semibold text-foreground">Image preview</p>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-lg text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close image preview"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                <div className="flex min-h-[18rem] items-center justify-center overflow-auto bg-background px-4 py-6 sm:px-6">
                  {hasError ? (
                    <p className="text-sm text-danger">
                      Unable to load this image preview.
                    </p>
                  ) : (
                    <div className="relative flex w-full items-center justify-center">
                      {isLoading ? (
                        <div
                          className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
                          role="status"
                          aria-live="polite"
                        >
                          Loading image...
                        </div>
                      ) : null}
                      <img
                        src={previewUrl}
                        alt={resolvedAltText}
                        className={`max-h-[calc(100vh-12rem)] max-w-full object-contain ${
                          isLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={() => {
                          setIsLoading(false)
                          setHasError(false)
                        }}
                        onError={() => {
                          setIsLoading(false)
                          setHasError(true)
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                  <Button
                    as="a"
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                  >
                    Open in new tab
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
