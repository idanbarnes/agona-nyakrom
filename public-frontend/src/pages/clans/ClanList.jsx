import { useEffect, useMemo, useState } from 'react'
import { getClans } from '../../api/endpoints.js'
import AnimatedHeroIntro from '../../components/motion/AnimatedHeroIntro.jsx'
import RevealItem from '../../components/motion/RevealItem.jsx'
import StaggerGridReveal from '../../components/motion/StaggerGridReveal.jsx'
import {
  Button,
  Card,
  CardSkeleton,
  DetailPageCTA,
  EmptyState,
  ErrorState,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'

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

function buildFeaturedClanPanels(items) {
  const featured = items
    .slice(0, 3)
    .map((item, index) => {
      const imagePath =
        item?.images?.large ||
        item?.images?.medium ||
        item?.images?.thumbnail ||
        item?.thumbnail ||
        item?.image

      return {
        id: item?.id || item?.slug || `clan-${index}`,
        name: item?.name || 'Clan profile',
        caption: (item?.caption || item?.intro || '').trim(),
        imageUrl: imagePath ? resolveAssetUrl(imagePath) : '',
      }
    })

  const fallbackPanels = [
    {
      id: 'heritage',
      name: 'Ancestral Identity',
      caption: 'Stories, emblems, and lineage preserved across generations.',
      imageUrl: '',
    },
    {
      id: 'leadership',
      name: 'Leadership Lineage',
      caption: 'Profiles of leaders who continue to shape community life.',
      imageUrl: '',
    },
    {
      id: 'community',
      name: 'Community Memory',
      caption: 'A living archive of clan heritage and belonging.',
      imageUrl: '',
    },
  ]

  return [...featured, ...fallbackPanels].slice(0, 3)
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

  const featuredPanels = useMemo(() => buildFeaturedClanPanels(items), [items])
  const totalClansLabel = loading ? 'Loading clans' : `${items.length} clans documented`

  return (
    <section className="container py-6 md:py-10">
      <div className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_32%),linear-gradient(135deg,_#fffaf2_0%,_#ffffff_45%,_#f8f5ef_100%)] shadow-[0_24px_60px_rgba(28,25,23,0.08)]">
        <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)] lg:items-center lg:px-10 lg:py-10">
          <AnimatedHeroIntro
            className="space-y-5"
            entry="left"
            visualEntry="up"
            headline={
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full border border-[#F3D3A2] bg-white/80 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#B45309] shadow-sm backdrop-blur">
                  Community Lineage
                </span>
                <div className="space-y-3">
                  <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-tight text-stone-950 sm:text-5xl lg:text-[3.7rem]">
                    Clans that carry the identity of Nyakrom forward.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                    Explore the clans, their symbols, and the leaders whose
                    stewardship keeps each community story alive.
                  </p>
                </div>
              </div>
            }
            subtext={
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-stone-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Archive
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {totalClansLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Focus
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    Heritage, leadership, belonging
                  </p>
                </div>
              </div>
            }
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  as="a"
                  href="#clans-grid"
                  className="rounded-full border-transparent bg-[#D97706] px-5 text-sm font-semibold text-white hover:bg-[#B45309]"
                >
                  Browse Clans
                </Button>
                <p className="text-sm text-stone-500">
                  Scroll through the collection to open each clan profile.
                </p>
              </div>
            }
            visual={
              <div className="relative">
                <div className="pointer-events-none absolute -left-5 top-6 h-24 w-24 rounded-full bg-amber-200/40 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-stone-300/30 blur-2xl" />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <article className="group relative row-span-2 overflow-hidden rounded-[1.75rem] border border-white/70 bg-stone-200 shadow-[0_18px_40px_rgba(28,25,23,0.16)]">
                    <div className="aspect-[4/5]">
                      {featuredPanels[0]?.imageUrl ? (
                        <img
                          src={featuredPanels[0].imageUrl}
                          alt={featuredPanels[0].name}
                          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-end bg-[linear-gradient(180deg,_#f5ede1_0%,_#ead9bd_100%)] p-5">
                          <p className="max-w-[11rem] text-lg font-semibold leading-tight text-stone-900">
                            {featuredPanels[0]?.name}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent p-5 text-white">
                      <p className="text-xl font-semibold leading-tight">
                        {featuredPanels[0]?.name}
                      </p>
                      {featuredPanels[0]?.caption ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/80">
                          {featuredPanels[0].caption}
                        </p>
                      ) : null}
                    </div>
                  </article>

                  {featuredPanels.slice(1).map((panel, index) => (
                    <article
                      key={panel.id || index}
                      className="group relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-stone-200 shadow-[0_16px_34px_rgba(28,25,23,0.12)]"
                    >
                      <div className="aspect-[5/4]">
                        {panel.imageUrl ? (
                          <img
                            src={panel.imageUrl}
                            alt={panel.name}
                            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-end bg-[linear-gradient(180deg,_#f8f5ef_0%,_#e8ddcd_100%)] p-4">
                            <p className="max-w-[10rem] text-base font-semibold leading-tight text-stone-900">
                              {panel.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-transparent p-4 text-white">
                        <p className="text-base font-semibold leading-tight">
                          {panel.name}
                        </p>
                        {panel.caption ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80">
                            {panel.caption}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      </div>

      <div className="mt-10" id="clans-grid">
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
          <StaggerGridReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const imagePath =
                item?.images?.medium ||
                item?.images?.large ||
                item?.images?.thumbnail ||
                item?.thumbnail ||
                item?.image
              const slug = item?.slug
              const caption = (item?.caption || item?.intro || '').trim()
              const imageUrl = imagePath ? resolveAssetUrl(imagePath) : ''

              return (
                <RevealItem key={item?.id || slug || item?.name}>
                  <Card className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white p-0 shadow-[0_10px_30px_rgba(28,25,23,0.08)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_18px_40px_rgba(28,25,23,0.14)]">
                    <div className="relative overflow-hidden bg-stone-100">
                      <div className="aspect-[4/5] w-full bg-stone-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item?.name || 'Clan emblem'}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full transform-gpu object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-stone-500">
                            Clan emblem unavailable
                          </div>
                        )}
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/30 via-stone-950/5 to-transparent" />
                    </div>

                    <div className="flex min-h-[8.5rem] flex-1 flex-col justify-between gap-3 px-4 py-4 sm:min-h-[9.25rem] sm:gap-4 sm:px-5 sm:py-5">
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="inline-flex max-w-full items-center truncate rounded-full bg-amber-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#D97706] sm:text-[0.68rem]">
                          Clan Profile
                        </p>
                        <div className="space-y-1">
                          <h2
                            className="line-clamp-2 text-lg font-semibold leading-snug text-stone-900 break-words sm:text-xl"
                            title={item?.name || 'Unnamed clan'}
                          >
                            {item?.name || 'Unnamed clan'}
                          </h2>
                          <p
                            className="line-clamp-2 text-xs leading-5 text-stone-500 sm:text-sm sm:leading-6"
                            title={caption || 'Explore this clan and its leadership history.'}
                          >
                            {caption || 'Explore this clan and its leadership history.'}
                          </p>
                        </div>
                      </div>
                      {slug ? (
                        <div className="flex justify-end">
                          <DetailPageCTA
                            to={`/clans/${slug}`}
                            label="Read Details"
                            className="text-xs font-semibold tracking-wide"
                          />
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </RevealItem>
              )
            })}
          </StaggerGridReveal>
        </StateGate>
      </div>
    </section>
  )
}

export default ClanList
