import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHallOfFameDetail } from '../../api/endpoints.js'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'

function HallOfFameDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadEntry = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing hall of fame slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getHallOfFameDetail(slug)
      const payload = response?.data || response?.item || response
      setItem(payload || null)
    } catch (err) {
      if (err?.status === 404) {
        setItem(null)
        setError(null)
      } else {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadEntry()
  }, [loadEntry])

  // Gather descriptive fields the backend might return.
  const details = useMemo(() => {
    if (!item) {
      return []
    }

    return [
      item?.bio,
      item?.description,
      item?.achievements,
      item?.summary,
    ].filter(Boolean)
  }, [item])

  // Prefer medium image, then fall back to any available image field.
  const imagePath =
    item?.images?.medium || item?.images?.large || item?.image || item?.photo
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null
  const role = item?.role || item?.title || item?.position

  return (
    <section className="container py-6 md:py-10">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <ErrorState
            message={error?.message || 'Unable to load this entry.'}
            onRetry={loadEntry}
          />
        }
        empty={
          <EmptyState
            title="Not found"
            description="This item may have been removed."
            action={
              <Button as={Link} to="/hall-of-fame" variant="ghost">
                Back to hall of fame
              </Button>
            }
          />
        }
      >
        <div className="space-y-8">
          <header className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <ImageWithFallback
                src={imageUrl}
                alt={item?.full_name || item?.name || 'Entry'}
                className="h-28 w-28 rounded-xl border border-border object-cover"
                fallbackText="No image"
              />
              <div>
                <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-4xl">
                  {item?.full_name || item?.name || 'Hall of Fame'}
                </h1>
                {role ? (
                  <p className="mt-2 text-sm text-muted-foreground">{role}</p>
                ) : null}
              </div>
            </div>
          </header>

          <div className="max-w-3xl space-y-4 leading-7 text-foreground">
            <Card className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle>Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {details.length > 0 ? (
                  details.map((detail, index) => (
                    <p key={index} className="text-foreground">
                      {detail}
                    </p>
                  ))
                ) : (
                  <p>No biography available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </StateGate>
    </section>
  )
}

export default HallOfFameDetail
