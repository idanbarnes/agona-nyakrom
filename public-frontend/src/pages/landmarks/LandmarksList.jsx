import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLandmarks } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import {
  Card,
  CardContent,
  CardSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  Pagination,
  StateGate,
} from '../../components/ui/index.jsx'

// Normalize the location field to a readable string.
function formatLocation(value) {
  if (!value) {
    return ''
  }

  return typeof value === 'string' ? value : JSON.stringify(value)
}

// Extract list data across possible payload shapes.
function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return (
    payload.items ||
    payload.data ||
    payload.results ||
    payload.landmarks ||
    []
  )
}

// Provide a brief fallback summary when only a long description is available.
function getShortDescription(item) {
  if (item?.short_description) {
    return item.short_description
  }

  if (item?.description) {
    const trimmed =
      item.description.length > 180
        ? `${item.description.slice(0, 180).trim()}...`
        : item.description
    return trimmed
  }

  return ''
}

function LandmarksList() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadLandmarks = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getLandmarks({ page, limit })
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

    loadLandmarks()

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
          Landmarks
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover notable places and historic locations across the community.
        </p>
      </div>
      <div className="mt-8 space-y-8">
        <StateGate
          loading={loading}
          error={error}
          isEmpty={!loading && !error && items.length === 0}
          skeleton={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={`landmark-skeleton-${index}`} />
              ))}
            </div>
          }
          errorFallback={
            <ErrorState
              message={error?.message || 'Unable to load landmarks.'}
            />
          }
          empty={
            <EmptyState
              title="No landmarks available"
              description="Please check back as new landmarks are added."
            />
          }
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const name = item?.name || item?.title || 'Untitled'
              const slug = item?.slug
              const location = formatLocation(item?.location)
              const thumbnail = item?.images?.thumbnail || item?.thumbnail
              const description = getShortDescription(item)

              return (
                <Card
                  key={item?.id || slug || name}
                  className="flex h-full flex-col overflow-hidden transition hover:shadow-sm"
                >
                  <ImageWithFallback
                    src={thumbnail ? resolveAssetUrl(thumbnail) : null}
                    alt={name || 'Landmark thumbnail'}
                    className="h-48 w-full object-cover"
                    fallbackText="No image"
                  />
                  <CardContent className="space-y-3 pt-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-foreground">
                        {slug ? (
                          <Link
                            to={`/landmarks/${slug}`}
                            className="hover:underline"
                          >
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </h2>
                      {location ? (
                        <p className="text-xs text-muted-foreground">
                          {location}
                        </p>
                      ) : null}
                    </div>
                    {description ? (
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    ) : null}
                  </CardContent>
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

export default LandmarksList
