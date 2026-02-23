import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLandmarks } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import {
  Card,
  CardSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  Pagination,
  StateGate,
} from '../../components/ui/index.jsx'

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
              const name = item?.name || 'Untitled'
              const slug = item?.slug
              const thumbnail = item?.images?.thumbnail || item?.thumbnail

              return (
                <Card
                  key={item?.id || slug || name}
                  className="group relative overflow-hidden rounded-xl border-0 shadow-sm transition hover:shadow-md"
                >
                  <ImageWithFallback
                    src={thumbnail ? resolveAssetUrl(thumbnail) : null}
                    alt={name || 'Landmark portrait'}
                    className="h-[22rem] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    fallbackText="No image"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                    <h2 className="text-base font-semibold text-white md:text-lg">
                      {name}
                    </h2>
                    {slug ? (
                      <Link
                        to={`/landmarks/${slug}`}
                        className="rounded-full border border-white/70 bg-transparent px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
                      >
                        Read details
                      </Link>
                    ) : null}
                  </div>
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
