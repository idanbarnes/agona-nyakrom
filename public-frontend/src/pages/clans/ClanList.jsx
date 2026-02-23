import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClans } from '../../api/endpoints.js'
import {
  Card,
  CardSkeleton,
  EmptyState,
  ErrorState,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'

// Extract list data across possible payload shapes.
function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return payload.items || payload.data || payload.results || payload.clans || []
}

function ClanList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadClans = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getClans()
        if (!isMounted) {
          return
        }

        const payload = response?.data || response
        setItems(extractItems(payload))
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

    loadClans()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="container py-6 md:py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground break-words md:text-3xl">
          Clans
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore clans and the leaders guiding each community.
        </p>
      </div>
      <div className="mt-8">
        <StateGate
          loading={loading}
          error={error}
          isEmpty={!loading && !error && items.length === 0}
          skeleton={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={`clan-skeleton-${index}`} />
              ))}
            </div>
          }
          errorFallback={
            <ErrorState message={error?.message || 'Unable to load clans.'} />
          }
          empty={
            <EmptyState
              title="No clans available"
              description="Please check back later for clan updates."
            />
          }
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const imagePath =
                item?.images?.medium ||
                item?.images?.large ||
                item?.images?.thumbnail ||
                item?.thumbnail ||
                item?.image
              const slug = item?.slug
              const caption = (item?.caption || item?.intro || '').trim()
              const imageUrl = imagePath ? resolveAssetUrl(imagePath) : ''

              return (
                <Card
                  key={item?.id || slug || item?.name}
                  className="group flex h-full min-h-[24rem] flex-col overflow-hidden transition hover:shadow-sm"
                >
                  <div className="flex-[9] overflow-hidden border-b border-border/70 bg-muted/30">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item?.name || 'Clan emblem'}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                        Clan emblem unavailable
                      </div>
                    )}
                  </div>

                  <div className="flex flex-[1] flex-col justify-between gap-2 px-4 py-3">
                    <h2 className="text-base font-semibold leading-tight text-foreground">
                      {item?.name || 'Unnamed clan'}
                    </h2>
                    {caption ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {caption}
                      </p>
                    ) : null}
                    {slug ? (
                      <div>
                        <Link
                          to={`/clans/${slug}`}
                          className="text-xs font-semibold uppercase tracking-wide text-primary underline-offset-4 hover:underline"
                        >
                          Read details
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </Card>
              )
            })}
          </div>
        </StateGate>
      </div>
    </section>
  )
}

export default ClanList
