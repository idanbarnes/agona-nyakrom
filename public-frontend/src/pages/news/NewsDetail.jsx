import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getNewsDetail, getNewsPreview } from '../../api/endpoints.js'
import {
  Button,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'

function formatDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function selectImage(images = {}, fallback) {
  if (images?.medium) {
    return images.medium
  }

  if (images?.large) {
    return images.large
  }

  if (images?.original) {
    return images.original
  }

  return fallback
}

function CalendarIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M8 3v4M16 3v4M3 10h18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function PersonIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M5 19c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function ShareIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle
        cx="18"
        cy="5"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="6"
        cy="12"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="18"
        cy="19"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="m8.1 11 7.8-4.5m-7.8 6 7.8 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
}

function resolveAuthor(item) {
  if (item?.author?.name) {
    return item.author.name
  }

  if (item?.author_name) {
    return item.author_name
  }

  if (item?.authorName) {
    return item.authorName
  }

  if (item?.reporter) {
    return item.reporter
  }

  return 'Unknown author'
}

function buildSharePayload(item, url) {
  const rawContent = String(item?.content || '').trim()
  const snippet = rawContent ? `${rawContent.slice(0, 120)}...` : ''

  return {
    title: item?.title || 'News update',
    text: snippet || `Read ${item?.title || 'this news update'}`,
    url,
  }
}

function ShareMenu({ url, title, text }) {
  const [copied, setCopied] = useState(false)
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text || title)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
      <div className="space-y-1">
        <a
          href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center rounded-lg border border-transparent px-3 text-xs font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
        >
          WhatsApp
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center rounded-lg border border-transparent px-3 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center rounded-lg border border-transparent px-3 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-900 hover:text-white"
        >
          X
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-9 w-full items-center rounded-lg border border-transparent px-3 text-left text-xs font-medium text-gray-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

function NewsDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef(null)
  const previewToken = useMemo(() => {
    const token = new URLSearchParams(location.search).get('preview_token')
    return String(token || '').trim()
  }, [location.search])
  const isPreviewMode = Boolean(previewToken)
  const isEmbeddedPreview = useMemo(() => {
    if (!isPreviewMode) {
      return false
    }

    try {
      return window.self !== window.top
    } catch {
      return true
    }
  }, [isPreviewMode])

  const loadNews = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing news slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = isPreviewMode
        ? await getNewsPreview(slug, previewToken)
        : await getNewsDetail(slug)
      const payload = response?.data || response?.item || response
      setItem(payload || null)
    } catch (err) {
      if (isPreviewMode && (err?.status === 401 || err?.status === 403)) {
        setItem(null)
        setError(
          new Error(
            'This preview link is invalid or has expired. Generate a new preview from the admin dashboard.',
          ),
        )
      } else if (isPreviewMode && err?.status === 404) {
        setItem(null)
        setError(
          new Error(
            'This preview is unavailable. The draft may have been removed.',
          ),
        )
      } else if (err?.status === 404) {
        setItem(null)
        setError(null)
      } else {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [isPreviewMode, previewToken, slug])

  useEffect(() => {
    loadNews()
  }, [loadNews])

  useEffect(() => {
    if (!isPreviewMode) {
      return undefined
    }

    const handlePreviewRefresh = (event) => {
      if (typeof event?.preventDefault === 'function') {
        event.preventDefault()
      }

      void loadNews()
    }

    window.addEventListener('cms-preview-refresh', handlePreviewRefresh)
    return () => {
      window.removeEventListener('cms-preview-refresh', handlePreviewRefresh)
    }
  }, [isPreviewMode, loadNews])

  const publishedAt = item?.published_at || item?.publishedAt
  const authorLabel = resolveAuthor(item)
  const dateLabel = useMemo(() => formatDate(publishedAt), [publishedAt])
  const imagePath = selectImage(item?.images, item?.image)
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null
  const shareUrl = useMemo(() => {
    const detailsPath = slug ? `/news/${slug}` : '/news'
    if (typeof window === 'undefined' || !window.location?.origin) {
      return detailsPath
    }

    return new URL(detailsPath, window.location.origin).toString()
  }, [slug])
  const sharePayload = buildSharePayload(item, shareUrl)

  useEffect(() => {
    if (!shareOpen) {
      return undefined
    }

    const handleOutsideClick = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShareOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShareOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [shareOpen])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(sharePayload)
        setShareOpen(false)
        return
      } catch {
        setShareOpen((current) => !current)
        return
      }
    }

    setShareOpen((current) => !current)
  }

  return (
    <section
      className={
        isEmbeddedPreview
          ? 'mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-6'
          : 'container py-6 md:py-10'
      }
    >
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <ErrorState
            message={error?.message || 'Unable to load this news story.'}
            onRetry={loadNews}
          />
        }
        empty={
          <EmptyState
            title={isPreviewMode ? 'Preview unavailable' : 'Not found'}
            description={
              isPreviewMode
                ? 'This preview link may be invalid, expired, or no longer available.'
                : 'This item may have been removed.'
            }
            action={
              <Button as={Link} to="/news" variant="ghost">
                Back to news
              </Button>
            }
          />
        }
      >
        <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition hover:shadow-[0_18px_40px_rgba(15,23,42,0.11)]">
          <div className="p-5 sm:p-7 lg:p-8">
            <header>
              <h1 className="max-w-4xl break-words text-2xl font-semibold leading-tight tracking-tight text-gray-900 md:text-4xl">
                {item?.title || 'News detail'}
              </h1>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-gray-600 sm:text-sm">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
                    <PersonIcon className="h-4 w-4 text-gray-600" />
                    <span>Author: {authorLabel}</span>
                  </span>
                  {dateLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                      <span>{dateLabel}</span>
                    </span>
                  ) : null}
                </div>

                <div className="relative shrink-0" ref={shareRef}>
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label={`Share ${item?.title || 'this news item'}`}
                    aria-expanded={shareOpen}
                    aria-haspopup="menu"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    <ShareIcon className="h-[18px] w-[18px]" />
                    <span>Share</span>
                  </button>

                  {shareOpen ? (
                    <ShareMenu
                      url={shareUrl}
                      title={sharePayload.title}
                      text={sharePayload.text}
                    />
                  ) : null}
                </div>
              </div>
            </header>

            <div className="mt-5 border-t border-gray-200 pt-6">
              {imageUrl ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 sm:p-3">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={item?.title || 'News image'}
                    className="h-[220px] w-full rounded-lg object-contain sm:h-[320px] lg:h-[420px]"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-7">
              {item?.content ? (
                <p className="max-w-3xl whitespace-pre-line text-base leading-7 text-gray-700">
                  {item.content}
                </p>
              ) : (
                <p className="text-gray-500">No content available.</p>
              )}
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <Button
                as={Link}
                to="/news"
                variant="ghost"
                className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back to news
              </Button>
            </div>
          </div>
        </article>
      </StateGate>
    </section>
  )
}

export default NewsDetail
