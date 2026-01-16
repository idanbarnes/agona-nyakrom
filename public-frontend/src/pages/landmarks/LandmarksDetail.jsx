import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLandmarkDetail } from '../../api/endpoints.js'
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

// Prefer medium image, then fall back to any available image field.
function selectImage(images = {}, fallback) {
  if (images?.medium) {
    return images.medium
  }

  if (images?.large) {
    return images.large
  }

  if (images?.original) {
    return images.original
  }

  return fallback
}

function LandmarksDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadLandmark = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing landmark slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getLandmarkDetail(slug)
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
    loadLandmark()
  }, [loadLandmark])

  const name = item?.name || item?.title || 'Landmark'
  const imagePath = selectImage(item?.images, item?.image)
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  const metaItems = [item?.location, item?.region, item?.category].filter(Boolean)

  return (
    <section className="container py-6 md:py-10">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <ErrorState
            message={error?.message || 'Unable to load this landmark.'}
            onRetry={loadLandmark}
          />
        }
        empty={
          <EmptyState
            title="Not found"
            description="This item may have been removed."
            action={
              <Button as={Link} to="/landmarks" variant="ghost">
                Back to landmarks
              </Button>
            }
          />
        }
      >
        <div className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight text-foreground break-words md:text-4xl">
              {name}
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
              alt={name}
              className="h-56 w-full rounded-xl border border-border object-cover md:h-80"
            />
          ) : null}

          <div className="max-w-3xl space-y-4 leading-7 text-foreground">
            <Card className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle>About this landmark</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {item?.description ? (
                  <p className="text-foreground">{item.description}</p>
                ) : (
                  <p>No description available.</p>
                )}
              </CardContent>
            </Card>

            {item?.google_map_link ? (
              <Card className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <a
                    href={item.google_map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on Google Maps
                  </a>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </StateGate>
    </section>
  )
}

export default LandmarksDetail
