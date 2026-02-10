import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNews } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => {
              const publishedAt =
                item?.published_at || item?.publishedAt || item?.createdAt
              const dateLabel = formatDate(publishedAt)
              const thumbnail = item?.images?.thumbnail
              const slug = item?.slug

              return (
                <Card
                  key={item?.id || slug || item?.title}
                  className="flex h-full flex-col overflow-hidden transition hover:shadow-sm"
                >
                  <ImageWithFallback
                    src={thumbnail ? resolveAssetUrl(thumbnail) : null}
                    alt={item?.title || 'News thumbnail'}
                    className="h-40 w-full object-cover"
                    fallbackText="No image"
                  />
                  <CardContent className="flex flex-1 flex-col gap-3 pt-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-foreground">
                        {slug ? (
                          <Link
                            to={`/news/${slug}`}
                            className="hover:underline"
                          >
                            {item?.title || 'Untitled'}
                          </Link>
                        ) : (
                          item?.title || 'Untitled'
                        )}
                      </h2>
                      {dateLabel ? (
                        <p className="text-xs text-muted-foreground">
                          Published {dateLabel}
                        </p>
                      ) : null}
                    </div>
                    {item?.summary ? (
                      <p className="text-sm text-muted-foreground">
                        {item.summary}
                      </p>
                    ) : null}
                  </CardContent>
                  <CardFooter className="justify-start">
                    {slug ? (
                      <Button
                        as={Link}
                        to={`/news/${slug}`}
                        variant="ghost"
                        size="sm"
                      >
                        Read more
                      </Button>
                    ) : null}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
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
