import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHallOfFame } from '../../api/endpoints.js'
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

  return (
    payload.items ||
    payload.data ||
    payload.results ||
    payload.hall_of_fame ||
    payload.hallOfFame ||
    []
  )
}

function HallOfFameList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadHallOfFame = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getHallOfFame()
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

    loadHallOfFame()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="container py-6 md:py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground break-words md:text-3xl">
          Hall of Fame
        </h1>
        <p className="text-sm text-muted-foreground">
          Celebrating the people whose achievements shaped our history.
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
                <CardSkeleton key={`hof-skeleton-${index}`} />
              ))}
            </div>
          }
          errorFallback={
            <ErrorState
              message={error?.message || 'Unable to load hall of fame entries.'}
            />
          }
          empty={
            <EmptyState
              title="No hall of fame entries yet"
              description="Please check back as we highlight community heroes."
            />
          }
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const thumbnail = item?.images?.thumbnail || item?.thumbnail || item?.imageUrl
              const slug = item?.slug
              const routeKey = slug || item?.id
              const name = item?.full_name || item?.name || 'Unnamed'
              const role = item?.title || item?.role || item?.position

              return (
                <Card
                  key={item?.id || slug || name}
                  className="flex h-full flex-col rounded-2xl border border-border/70 bg-surface shadow-sm transition hover:shadow-md"
                >
                  <div className="p-4 pb-0">
                    <CmsCardImage
                      src={thumbnail}
                      alt={`${name} portrait`}
                      ratio="4/5"
                      className="rounded-2xl bg-muted"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>

                  <CardContent className="flex h-full flex-col px-5 pb-5">
                    <div className="pt-4">
                      <h2 className="text-xl leading-tight font-semibold text-foreground">
                        {name}
                      </h2>
                      {role ? (
                        <p className="mt-1 text-sm text-muted-foreground">{role}</p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex justify-end">
                      {routeKey ? (
                        <Link
                          to={`/hall-of-fame/${routeKey}`}
                          className="mt-auto inline-flex items-center rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          Read more
                        </Link>
                      ) : (
                        <span className="mt-auto inline-flex items-center rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
                          Read more
                        </span>
                      )}
                    </div>
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

export default HallOfFameList
