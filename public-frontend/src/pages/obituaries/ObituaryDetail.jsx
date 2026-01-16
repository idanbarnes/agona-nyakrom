import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getObituaryDetail } from '../../api/endpoints.js'
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

function ObituaryDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadObituary = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing obituary slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getObituaryDetail(slug)
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
    loadObituary()
  }, [loadObituary])

  // Memoize date parsing to avoid repeated Date construction on re-renders.
  const dateOfBirth = useMemo(
    () => (item?.date_of_birth ? new Date(item.date_of_birth) : null),
    [item?.date_of_birth],
  )
  const dateOfDeath = useMemo(
    () => (item?.date_of_death ? new Date(item.date_of_death) : null),
    [item?.date_of_death],
  )
  const funeralDate = useMemo(
    () => (item?.funeral_date ? new Date(item.funeral_date) : null),
    [item?.funeral_date],
  )
  const burialDate = useMemo(
    () => (item?.burial_date ? new Date(item.burial_date) : null),
    [item?.burial_date],
  )

  // Format dates consistently when a valid date is available.
  const formatDate = (date) =>
    date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null

  // Prefer medium image, then fall back to any available image field.
  const imagePath =
    item?.images?.medium || item?.images?.large || item?.image || item?.photo
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  const birthLabel = formatDate(dateOfBirth)
  const deathLabel = formatDate(dateOfDeath)
  const funeralLabel = formatDate(funeralDate)
  const burialLabel = formatDate(burialDate)
  const hasServiceDetails = funeralLabel || burialLabel

  const metaItems = [
    item?.age ? `Age ${item.age}` : null,
    birthLabel ? `Born ${birthLabel}` : null,
    deathLabel ? `Passed ${deathLabel}` : null,
  ].filter(Boolean)

  return (
    <section className="container py-6 md:py-10">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <ErrorState
            message={error?.message || 'Unable to load this obituary.'}
            onRetry={loadObituary}
          />
        }
        empty={
          <EmptyState
            title="Not found"
            description="This item may have been removed."
            action={
              <Button as={Link} to="/obituaries" variant="ghost">
                Back to obituaries
              </Button>
            }
          />
        }
      >
        <div className="space-y-8">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight text-foreground break-words md:text-4xl">
              {item?.full_name || 'Obituary'}
            </h1>
            {metaItems.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {metaItems.map((meta) => (
                  <span key={meta}>{meta}</span>
                ))}
              </div>
            ) : null}
          </header>

          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt={item?.full_name || 'Obituary'}
              className="h-56 w-full rounded-xl border border-border object-cover md:h-80"
            />
          ) : null}

          <div className="max-w-3xl space-y-6 leading-7 text-foreground">
            <Card className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle>Biography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {item?.biography ? (
                  <p className="text-foreground">{item.biography}</p>
                ) : (
                  <p>No biography provided.</p>
                )}
              </CardContent>
            </Card>

            {hasServiceDetails ? (
              <Card className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {funeralLabel ? (
                    <p>
                      <span className="font-medium text-foreground">
                        Funeral date:
                      </span>{' '}
                      {funeralLabel}
                    </p>
                  ) : null}
                  {burialLabel ? (
                    <p>
                      <span className="font-medium text-foreground">
                        Burial date:
                      </span>{' '}
                      {burialLabel}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </StateGate>
    </section>
  )
}

export default ObituaryDetail
