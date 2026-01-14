import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNews } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import {
  EmptyState,
  ErrorState,
  ImageWithFallback,
  ListSkeleton,
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

  return date.toLocaleDateString()
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

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">News</h1>
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && visibleItems.length === 0}
        skeleton={<ListSkeleton rows={4} showAvatar />}
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
        <ul className="space-y-6">
          {visibleItems.map((item) => {
            const publishedAt =
              item?.published_at || item?.publishedAt || item?.createdAt
            const dateLabel = formatDate(publishedAt)
            const thumbnail = item?.images?.thumbnail
            const slug = item?.slug

            return (
              <li
                key={item?.id || slug || item?.title}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  <ImageWithFallback
                    src={thumbnail ? resolveAssetUrl(thumbnail) : null}
                    alt={item?.title || 'News thumbnail'}
                    className="h-40 w-full rounded-md object-cover md:h-28 md:w-40"
                    fallbackText="No image"
                  />
                  <div className="flex-1 space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {slug ? (
                        <Link to={`/news/${slug}`} className="hover:underline">
                          {item?.title || 'Untitled'}
                        </Link>
                      ) : (
                        item?.title || 'Untitled'
                      )}
                    </h2>
                    {item?.summary ? (
                      <p className="text-sm text-muted-foreground">
                        {item.summary}
                      </p>
                    ) : null}
                    {dateLabel ? (
                      <p className="text-xs text-muted-foreground">
                        Published: {dateLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </StateGate>

      <nav aria-label="News pagination" className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </nav>
    </section>
  )
}

export default NewsList
