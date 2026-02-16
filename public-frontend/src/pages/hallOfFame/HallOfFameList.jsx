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

// Provide a brief summary across common field names.
function getSummary(item) {
  const summary =
    item?.summary || item?.short_bio || item?.shortBio || item?.bio
  if (summary) {
    return summary
  }

  const description = item?.description || item?.achievements || ''
  if (!description) {
    return ''
  }

  return description.length > 180
    ? `${description.slice(0, 180).trim()}...`
    : description
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
              const thumbnail = item?.images?.thumbnail || item?.thumbnail
              const slug = item?.slug
              const name = item?.full_name || item?.name || 'Unnamed'
              const summary = getSummary(item)
              const role = item?.title || item?.role || item?.position

              return (
                <Card
                  key={item?.id || slug || name}
                  className="flex h-full flex-col overflow-hidden transition hover:shadow-sm"
                >
                  <CmsCardImage
                    src={thumbnail}
                    alt={`${name} portrait`}
                    ratio="4/5"
                    className="rounded-none"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <CardContent className="space-y-3 pt-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-foreground">
                        {slug ? (
                          <Link
                            to={`/hall-of-fame/${slug}`}
                            className="hover:underline"
                          >
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </h2>
                      {role ? (
                        <p className="text-sm text-muted-foreground">{role}</p>
                      ) : null}
                    </div>
                    {summary ? (
                      <p className="text-sm text-muted-foreground">{summary}</p>
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

export default HallOfFameList
