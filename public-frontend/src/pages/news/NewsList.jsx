import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNews } from '../../api/endpoints.js'
import CmsCardImage from '../../components/media/CmsCardImage.jsx'
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
  StateGate,
} from '../../components/ui/index.jsx'

function formatDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return payload.items || payload.data || payload.results || payload.news || []
}

function CalendarIcon({ className = 'h-4 w-4' }) {
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

function ArrowRightIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
    </svg>
  )
}

function toPlainText(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser()
    const documentFragment = parser.parseFromString(trimmed, 'text/html')
    return String(documentFragment.body?.textContent || '').trim()
  }

  return trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function excerptWithWordLimit(content, wordLimit = 13) {
  const words = toPlainText(content).split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return null
  }

  return `${words.slice(0, wordLimit).join(' ')}...`
}

function selectImage(item) {
  return (
    item?.images?.medium ||
    item?.images?.large ||
    item?.images?.thumbnail ||
    item?.images?.original ||
    item?.image ||
    null
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

function buildSharePayload(item, url, excerpt) {
  return {
    title: item?.title || 'News update',
    text: excerpt || `Read ${item?.title || 'this news update'}`,
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
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
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

function NewsCard({ item }) {
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef(null)
  const slug = item?.slug
  const canViewDetails = Boolean(slug)
  const detailsPath = canViewDetails ? `/news/${slug}` : '/news'
  const publishedAt = item?.published_at || item?.publishedAt || item?.createdAt
  const dateLabel = formatDate(publishedAt)
  const authorLabel = resolveAuthor(item)
  const imagePath = selectImage(item)
  const excerpt =
    excerptWithWordLimit(item?.content, 13) ||
    excerptWithWordLimit(item?.summary, 13) ||
    'No content available...'
  const shareUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? new URL(detailsPath, window.location.origin).toString()
      : detailsPath
  const sharePayload = buildSharePayload(item, shareUrl, excerpt)

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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
      <div className="relative overflow-hidden">
        <CmsCardImage
          src={imagePath}
          alt={item?.title || 'News thumbnail'}
          ratio="16/10"
          className="rounded-none bg-gray-100"
          imgClassName="transition duration-700 group-hover:scale-105"
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-gray-700">
          {canViewDetails ? (
            <Link
              to={detailsPath}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              {item?.title || 'Untitled'}
            </Link>
          ) : (
            item?.title || 'Untitled'
          )}
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-600">{excerpt}</p>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600 sm:text-sm">
            {dateLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{dateLabel}</span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
              <span
                className="h-1.5 w-1.5 rounded-full bg-gray-400"
                aria-hidden="true"
              />
              <span>{authorLabel}</span>
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            {canViewDetails ? (
              <Link
                to={detailsPath}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                <span>Read more</span>
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ) : null}

            <div className="relative" ref={shareRef}>
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
        </div>
      </div>
    </article>
  )
}

function NewsList() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadNews = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getNews({ page, limit })
        if (!isMounted) {
          return
        }

        const payload = response?.data || response
        setItems(extractItems(payload))
        // Capture pagination metadata when the backend includes it.
        setMeta(payload?.meta || payload?.pagination || response?.meta || null)
      } catch (err) {
        if (isMounted) {
          setError(err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadNews()

    return () => {
      isMounted = false
    }
  }, [limit, page])

  const hasNextPage = useMemo(() => {
    if (meta?.hasNextPage !== undefined) {
      return Boolean(meta.hasNextPage)
    }

    if (meta?.totalPages) {
      return page < meta.totalPages
    }

    if (meta?.total) {
      return page * limit < meta.total
    }

    // Fallback: if we received fewer items than the limit, assume no more pages.
    return items.length >= limit
  }, [items.length, limit, meta, page])

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item?.published !== false &&
          item?.status !== 'draft' &&
          item?.status !== 'unpublished',
      ),
    [items],
  )

  const totalPages = useMemo(() => {
    if (meta?.totalPages) {
      return meta.totalPages
    }

    if (meta?.total_pages) {
      return meta.total_pages
    }

    if (meta?.total) {
      return Math.ceil(meta.total / limit)
    }

    return hasNextPage ? page + 1 : page
  }, [hasNextPage, limit, meta, page])

  return (
    <section className="container py-6 md:py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground break-words md:text-3xl">
          News
        </h1>
        <p className="text-sm text-muted-foreground">
          The latest stories, announcements, and community updates.
        </p>
      </div>
      <div className="mt-8 space-y-8">
        <StateGate
          loading={loading}
          error={error}
          isEmpty={!loading && !error && visibleItems.length === 0}
          skeleton={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={`news-skeleton-${index}`} />
              ))}
            </div>
          }
          errorFallback={
            <ErrorState message={error?.message || 'Unable to load news.'} />
          }
          empty={
            <EmptyState
              title="No news yet"
              description="Check back soon for updates from the community."
            />
          }
        >
          <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {visibleItems.map((item) => {
              const slug = item?.slug

              return (
                <li key={item?.id || slug || item?.title}>
                  <NewsCard item={item} />
                </li>
              )
            })}
          </ul>
        </StateGate>

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </section>
  )
}

export default NewsList
