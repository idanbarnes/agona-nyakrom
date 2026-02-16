import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClans } from '../../api/endpoints.js'
import CmsCardImage from '../../components/media/CmsCardImage.jsx'
import {
  Card,
  CardContent,
  CardSkeleton,
  EmptyState,
  ErrorState,
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
              const thumbnail = item?.images?.thumbnail || item?.thumbnail
              const slug = item?.slug
              const leadersCount =
                item?.leaders_count ||
                item?.leadersCount ||
                item?.leaders?.length

              return (
                <Card
                  key={item?.id || slug || item?.name}
                  className="flex h-full flex-col overflow-hidden transition hover:shadow-sm"
                >
                  <CmsCardImage
                    src={thumbnail}
                    alt={item?.name || 'Clan thumbnail'}
                    ratio="16/9"
                    className="rounded-none"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <CardContent className="space-y-3 pt-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-foreground">
                        {slug ? (
                          <Link
                            to={`/clans/${slug}`}
                            className="hover:underline"
                          >
                            {item?.name || 'Unnamed clan'}
                          </Link>
                        ) : (
                          item?.name || 'Unnamed clan'
                        )}
                      </h2>
                      {leadersCount ? (
                        <p className="text-xs text-muted-foreground">
                          {leadersCount} leader
                          {leadersCount === 1 ? '' : 's'}
                        </p>
                      ) : null}
                    </div>
                    {item?.intro ? (
                      <p className="text-sm text-muted-foreground">
                        {item.intro}
                      </p>
                    ) : null}
                  </CardContent>
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
