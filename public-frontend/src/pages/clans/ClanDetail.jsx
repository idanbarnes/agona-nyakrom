import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClanDetail } from '../../api/endpoints.js'
import ClanDetailHero from '../../components/clans/ClanDetailHero.jsx'
import ImageLightbox from '../../components/ImageLightbox.jsx'
import RevealItem from '../../components/motion/RevealItem.jsx'
import StaggerGridReveal from '../../components/motion/StaggerGridReveal.jsx'
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
import useCmsPreviewRefresh from '../../lib/useCmsPreviewRefresh.js'

const EMPTY_LEADERS = { current: [], past: [] }

function getLeaderImageUrl(leader) {
  const leaderImagePath =
    leader?.images?.large ||
    leader?.images?.medium ||
    leader?.images?.thumbnail ||
    leader?.images?.original ||
    leader?.image

  return leaderImagePath ? resolveAssetUrl(leaderImagePath) : ''
}

function LeaderProfileCard({ leader, onPreview }) {
  const leaderImageUrl = getLeaderImageUrl(leader)
  const leaderName = leader?.name?.trim() || null
  const leaderTitle = leader?.title?.trim() || null
  const leaderRole = leader?.position?.trim() || 'Leader'
  const displayHeading = leaderTitle || leaderRole
  const badgeLabel = leaderRole !== displayHeading ? leaderRole : null
  const displayName = leaderName && leaderName !== leaderTitle ? leaderName : null

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white p-0 shadow-[0_10px_30px_rgba(28,25,23,0.08)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_18px_40px_rgba(28,25,23,0.14)]">
      <button
        type="button"
        onClick={() =>
          leaderImageUrl
            ? onPreview({
                src: leaderImageUrl,
                alt: displayHeading,
                caption: [badgeLabel, displayName].filter(Boolean).join(' - ') || leaderRole,
              })
            : null
        }
        className="relative block w-full overflow-hidden bg-stone-100 text-left"
        aria-label={
          leaderImageUrl
            ? `View image of ${displayHeading}`
            : `Image unavailable for ${displayHeading}`
        }
      >
        <div className="aspect-[4/5] w-full bg-stone-100">
          {leaderImageUrl ? (
            <img
              src={leaderImageUrl}
              alt={displayHeading}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-stone-500">
              No image available
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/30 via-stone-950/5 to-transparent" />
      </button>

      <div className="flex min-h-[8.5rem] flex-1 flex-col justify-between gap-3 px-4 py-4 sm:min-h-[9.25rem] sm:gap-4 sm:px-5 sm:py-5">
        <div className="space-y-1.5 sm:space-y-2">
          {badgeLabel ? (
            <p
              className="inline-flex max-w-full items-center truncate rounded-full bg-amber-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#D97706] sm:text-[0.68rem]"
              title={badgeLabel}
            >
              {badgeLabel}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <h3
              className="line-clamp-2 text-xl font-semibold leading-tight text-stone-950 break-words sm:text-2xl"
              title={displayHeading}
            >
              {displayHeading}
            </h3>
            {displayName ? (
              <p
                className="line-clamp-2 text-xs leading-5 text-stone-400 sm:text-sm sm:leading-6"
                title={displayName}
              >
                {displayName}
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-stone-400 sm:text-xs sm:tracking-[0.18em]">
          {leaderImageUrl ? 'Tap image to expand' : 'Portrait unavailable'}
        </p>
      </div>
    </Card>
  )
}

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

  useCmsPreviewRefresh(loadClan)

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
    <section className="rounded-[1.75rem] border border-stone-200/80 bg-gradient-to-br from-white via-stone-50/60 to-white p-5 shadow-[0_14px_40px_rgba(28,25,23,0.08)] sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D97706]">
            Clan Leadership
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-950 md:text-2xl">
            {title}
          </h2>
        </div>
        <p className="text-sm text-stone-500">
          {leaders.length} profile{leaders.length === 1 ? '' : 's'}
        </p>
      </div>
      {leaders.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">No {title.toLowerCase()} listed.</p>
      ) : (
        <StaggerGridReveal className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {leaders.map((leader) => (
            <RevealItem key={leader.id || leader.name || leader.position}>
              <LeaderProfileCard
                leader={leader}
                onPreview={(preview) => setLightboxImage(preview)}
              />
            </RevealItem>
          ))}
        </StaggerGridReveal>
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
          <ClanDetailHero
            name={clanName}
            caption={caption}
            body={body}
            imageUrl={imageUrl}
            currentLeaderCount={currentLeaders.length}
            pastLeaderCount={pastLeaders.length}
          />

          <section
            id="clan-history"
            className="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(28,25,23,0.08)] sm:p-7 lg:p-9"
          >
            <div className="max-w-4xl space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D97706]">
                  Clan History
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-stone-950 md:text-3xl">
                  Story, identity, and belonging
                </h2>
                {caption ? (
                  <p className="text-base leading-7 text-stone-600 md:text-lg">
                    {caption}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 text-stone-700">
                {body ? (
                  <RichTextRenderer html={body} />
                ) : (
                  <p className="text-stone-500">No content available.</p>
                )}
              </div>
            </div>
          </section>

          <div className="space-y-6" id="clan-leadership">
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
