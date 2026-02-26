import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHallOfFameDetail } from '../../api/endpoints.js'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import {
  Button,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import useCmsPreviewRefresh from '../../lib/useCmsPreviewRefresh.js'

function HallOfFameDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadEntry = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing hall of fame identifier.'))
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

  useCmsPreviewRefresh(loadEntry)

  const name = item?.name || item?.full_name || 'Hall of Fame'
  const role = item?.title || item?.position || item?.role || ''
  const body = item?.body || item?.bio || item?.description || item?.content || ''

  const imagePath =
    item?.imageUrl ||
    item?.images?.large ||
    item?.images?.medium ||
    item?.images?.original ||
    item?.image ||
    item?.photo

  const imageUrl = useMemo(() => (imagePath ? resolveAssetUrl(imagePath) : ''), [imagePath])

  return (
    <section className="bg-background py-8 sm:py-10 md:py-12">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <div className="container">
            <ErrorState
              message={error?.message || 'Unable to load this entry.'}
              onRetry={loadEntry}
            />
          </div>
        }
        empty={
          <div className="container">
            <EmptyState
              title="Not found"
              description="This Hall of Fame entry may have been removed."
              action={
                <Button as={Link} to="/hall-of-fame" variant="ghost">
                  Back to hall of fame
                </Button>
              }
            />
          </div>
        }
      >
        <article className="container mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-7 lg:p-9">
            <div className="grid gap-6 md:grid-cols-[minmax(220px,300px),1fr] md:items-start lg:gap-10">
              <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/40">
                <div className="aspect-[4/5]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${name} portrait`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      Portrait image unavailable
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <header className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
                    {name}
                  </h1>
                  {role ? (
                    <p className="text-base text-muted-foreground md:text-lg">{role}</p>
                  ) : null}
                </header>

                <div className="min-w-0">
                  {body ? (
                    <RichTextRenderer html={body} />
                  ) : (
                    <p className="text-muted-foreground">No biography available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </StateGate>
    </section>
  )
}

export default HallOfFameDetail
