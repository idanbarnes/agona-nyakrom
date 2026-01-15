import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getNewsDetail } from '../../api/endpoints.js'
import {
  Button,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'

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

function NewsDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadNews = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing news slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getNewsDetail(slug)
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
    loadNews()
  }, [loadNews])

  const publishedAt = item?.published_at || item?.publishedAt
  const dateLabel = useMemo(() => formatDate(publishedAt), [publishedAt])
  const imagePath = selectImage(item?.images, item?.image)
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null
  const category = item?.category?.name || item?.category
  const reporter = item?.reporter

  const metaItems = [
    dateLabel ? `Published ${dateLabel}` : null,
    reporter ? `Reporter: ${reporter}` : null,
    category ? `Category: ${category}` : null,
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
            message={error?.message || 'Unable to load this news story.'}
            onRetry={loadNews}
          />
        }
        empty={
          <EmptyState
            title="Not found"
            description="This item may have been removed."
            action={
              <Button as={Link} to="/news" variant="ghost">
                Back to news
              </Button>
            }
          />
        }
      >
        <div className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-4xl">
              {item?.title || 'News Detail'}
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
              alt={item?.title || 'News image'}
              className="h-56 w-full rounded-xl border border-border object-cover md:h-80"
            />
          ) : null}

          <div className="max-w-3xl space-y-4 leading-7 text-foreground">
            {item?.content ? (
              <p>{item.content}</p>
            ) : (
              <p className="text-muted-foreground">No content available.</p>
            )}
          </div>
        </div>
      </StateGate>
    </section>
  )
}

export default NewsDetail
