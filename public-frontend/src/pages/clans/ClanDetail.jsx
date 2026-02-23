import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClanDetail } from '../../api/endpoints.js'
import ImageLightbox from '../../components/ImageLightbox.jsx'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import {
  Button,
  Card,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'

const EMPTY_LEADERS = { current: [], past: [] }

function ClanDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  const loadClan = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing clan slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getClanDetail(slug)
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
    loadClan()
  }, [loadClan])

  const currentLeaders = item?.leaders?.current || EMPTY_LEADERS.current
  const pastLeaders = item?.leaders?.past || EMPTY_LEADERS.past

  const clanName = item?.name || 'Clan'
  const caption = (item?.caption || item?.intro || '').trim()
  const body = item?.body || item?.history || ''
  const imagePath =
    item?.images?.large ||
    item?.images?.medium ||
    item?.images?.original ||
    item?.images?.thumbnail ||
    item?.image
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : ''

  const renderLeaderSection = (title, leaders) => (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        {title}
      </h2>
      {leaders.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No {title.toLowerCase()} listed.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((leader) => {
            const leaderImagePath =
              leader?.images?.large ||
              leader?.images?.medium ||
              leader?.images?.thumbnail ||
              leader?.images?.original ||
              leader?.image
            const leaderImageUrl = leaderImagePath
              ? resolveAssetUrl(leaderImagePath)
              : ''

            return (
              <Card
                key={leader.id || leader.name || leader.position}
                className="overflow-hidden p-0"
              >
                <div className="grid h-full min-h-[18rem] grid-rows-[4fr,1fr]">
                  <button
                    type="button"
                    onClick={() =>
                      leaderImageUrl
                        ? setLightboxImage({
                            src: leaderImageUrl,
                            alt: leader.name || leader.position || 'Leader portrait',
                            caption: leader.title || leader.position || '',
                          })
                        : null
                    }
                    className="relative h-full w-full overflow-hidden bg-muted/30 text-left"
                    aria-label={
                      leaderImageUrl
                        ? `View image of ${leader.name || leader.position || 'leader'}`
                        : 'Leader image unavailable'
                    }
                  >
                    {leaderImageUrl ? (
                      <img
                        src={leaderImageUrl}
                        alt={leader.name || leader.position || 'Leader portrait'}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                        No image available
                      </div>
                    )}
                  </button>

                  <div className="flex flex-col justify-center gap-1 px-4 py-3">
                    {leader.title ? (
                      <p className="text-sm font-semibold tracking-wide text-foreground">
                        {leader.title}
                      </p>
                    ) : null}
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary">
                      {leader.position || 'Leader'}
                    </p>
                    {leader.name ? (
                      <p className="text-xs font-normal italic text-muted-foreground">
                        {leader.name}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )

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
              message={error?.message || 'Unable to load this clan.'}
              onRetry={loadClan}
            />
          </div>
        }
        empty={
          <div className="container">
            <EmptyState
              title="Not found"
              description="This item may have been removed."
              action={
                <Button as={Link} to="/clans" variant="ghost">
                  Back to clans
                </Button>
              }
            />
          </div>
        }
      >
        <article className="container mx-auto max-w-6xl space-y-6">
          <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-7 lg:p-9">
            <div className="grid gap-6 md:grid-cols-[minmax(220px,300px),1fr] md:items-start lg:gap-10">
              <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/40">
                <div className="aspect-[4/5]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${clanName} emblem`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      Clan emblem unavailable
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <header className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground break-words md:text-4xl">
                    {clanName}
                  </h1>
                  {caption ? (
                    <p className="text-base text-muted-foreground md:text-lg">{caption}</p>
                  ) : null}
                </header>

                <div className="min-w-0">
                  {body ? (
                    <RichTextRenderer html={body} />
                  ) : (
                    <p className="text-muted-foreground">No content available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {renderLeaderSection('Current Leaders', currentLeaders)}
            {renderLeaderSection('Past Leaders', pastLeaders)}
          </div>
        </article>

        <ImageLightbox
          open={Boolean(lightboxImage)}
          onClose={() => setLightboxImage(null)}
          src={lightboxImage?.src || ''}
          alt={lightboxImage?.alt || 'Leader portrait'}
          caption={lightboxImage?.caption || ''}
        />
      </StateGate>
    </section>
  )
}

export default ClanDetail
