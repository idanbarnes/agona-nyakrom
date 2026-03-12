import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getHallOfFame } from '../../api/endpoints.js'
import AnimatedHeroIntro from '../../components/motion/AnimatedHeroIntro.jsx'
import RevealItem from '../../components/motion/RevealItem.jsx'
import StaggerGridReveal from '../../components/motion/StaggerGridReveal.jsx'
import CmsCardImage from '../../components/media/CmsCardImage.jsx'
import {
  Button,
  Card,
  CardContent,
  CardSkeleton,
  DetailPageCTA,
  EmptyState,
  ErrorState,
  Input,
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

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildFeaturedProfiles(items) {
  const featured = items.slice(0, 3).map((item, index) => {
    const imagePath =
      item?.images?.large ||
      item?.images?.medium ||
      item?.images?.thumbnail ||
      item?.thumbnail ||
      item?.imageUrl ||
      item?.image ||
      item?.photo
    const name = item?.full_name || item?.name || `Honouree ${index + 1}`
    const role = item?.title || item?.role || item?.position || 'Hall of Fame Honouree'
    const summary = stripHtml(
      item?.excerpt || item?.bio || item?.description || item?.body || item?.content || '',
    )

    return {
      id: item?.id || item?.slug || name,
      imagePath,
      name,
      role,
      summary,
    }
  })

  const fallbackProfiles = [
    {
      id: 'legacy',
      imagePath: '',
      name: 'Legacy Preserved',
      role: 'Community memory',
      summary: 'Profiles that document the people whose work shaped Nyakrom across generations.',
    },
    {
      id: 'leadership',
      imagePath: '',
      name: 'Leadership Remembered',
      role: 'Historical record',
      summary: 'A growing archive of achievers, leaders, and cultural figures.',
    },
    {
      id: 'inspiration',
      imagePath: '',
      name: 'Inspiration Shared',
      role: 'Public archive',
      summary: 'Search the collection by name and open each story in full detail.',
    },
  ]

  return [...featured, ...fallbackProfiles].slice(0, 3)
}

function HallOfFameList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  const deferredSearchTerm = useDeferredValue(searchTerm)
  const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
  const featuredProfiles = useMemo(() => buildFeaturedProfiles(items), [items])
  const filteredItems = useMemo(() => {
    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) => {
      const name = (item?.full_name || item?.name || '').toLowerCase()
      return name.includes(normalizedSearch)
    })
  }, [items, normalizedSearch])

  const totalEntriesLabel = loading ? 'Loading honourees' : `${items.length} honourees documented`
  const matchCountLabel = normalizedSearch
    ? `${filteredItems.length} match${filteredItems.length === 1 ? '' : 'es'}`
    : 'Search by name'

  return (
    <section className="container py-6 md:py-10">
      <div className="overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(120,53,15,0.16),_transparent_30%),linear-gradient(135deg,_#fff9f0_0%,_#fffdf8_48%,_#f4ede2_100%)] shadow-[0_24px_60px_rgba(120,53,15,0.12)]">
        <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)] lg:items-center lg:px-10 lg:py-10">
          <AnimatedHeroIntro
            className="space-y-5"
            entry="left"
            visualEntry="up"
            headline={
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-white/85 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-amber-700 shadow-sm backdrop-blur">
                  Community Honours
                </span>
                <div className="space-y-3">
                  <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-tight text-stone-950 sm:text-5xl lg:text-[3.7rem]">
                    Hall of fame for the names that shaped Nyakrom.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                    Explore the archive of honourees, leaders, and public figures whose
                    stories continue to define the community&apos;s legacy.
                  </p>
                </div>
              </div>
            }
            subtext={
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-amber-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Archive
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {totalEntriesLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white/75 px-4 py-3 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Search
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {matchCountLabel}
                  </p>
                </div>
              </div>
            }
            actions={
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    as="a"
                    href="#hall-of-fame-grid"
                    className="rounded-full border-transparent bg-amber-700 px-5 text-sm font-semibold text-white hover:bg-amber-800"
                  >
                    Browse Profiles
                  </Button>
                  <p className="text-sm text-stone-500">
                    Use the search bar to find entries by name.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-amber-100 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
                  <label
                    htmlFor="hall-of-fame-search"
                    className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-stone-500"
                  >
                    Search Hall of Fame
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        id="hall-of-fame-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name"
                        aria-label="Search hall of fame by name"
                        className="h-12 rounded-full border-stone-200 bg-white pl-11 pr-4 text-sm shadow-none"
                      />
                    </div>
                    {searchTerm ? (
                      <Button
                        variant="ghost"
                        onClick={() => setSearchTerm('')}
                        className="h-12 rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            }
            visual={
              <div className="relative">
                <div className="pointer-events-none absolute -left-6 top-4 h-24 w-24 rounded-full bg-amber-200/45 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-stone-300/35 blur-2xl" />
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <article className="group relative row-span-2 overflow-hidden rounded-[1.75rem] border border-white/80 bg-stone-200 shadow-[0_18px_40px_rgba(120,53,15,0.18)]">
                    <CmsCardImage
                      src={featuredProfiles[0]?.imagePath}
                      alt={featuredProfiles[0]?.name}
                      ratio="4/5"
                      className="h-full rounded-none bg-[linear-gradient(180deg,_#f6ead7_0%,_#ead7bc_100%)]"
                      imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      sizes="(min-width: 1024px) 26vw, 100vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-transparent p-5 text-white">
                      <p className="text-xl font-semibold leading-tight">
                        {featuredProfiles[0]?.name}
                      </p>
                      <p className="mt-1 text-sm text-white/80">{featuredProfiles[0]?.role}</p>
                    </div>
                  </article>

                  {featuredProfiles.slice(1).map((profile, index) => (
                    <article
                      key={profile.id || index}
                      className="group relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-stone-200 shadow-[0_16px_34px_rgba(120,53,15,0.15)]"
                    >
                      <CmsCardImage
                        src={profile.imagePath}
                        alt={profile.name}
                        ratio="5/4"
                        className="h-full rounded-none bg-[linear-gradient(180deg,_#faf4ea_0%,_#eadfce_100%)]"
                        imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                        sizes="(min-width: 1024px) 18vw, 50vw"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent p-4 text-white">
                        <p className="text-base font-semibold leading-tight">{profile.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80">
                          {profile.role}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      </div>

      <div className="mt-10" id="hall-of-fame-grid">
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
          {filteredItems.length === 0 ? (
            <EmptyState
              title="No matching hall of fame entries"
              description={`No entry matched "${searchTerm.trim()}". Search by another name.`}
            />
          ) : (
            <StaggerGridReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
                const thumbnail = item?.images?.thumbnail || item?.thumbnail || item?.imageUrl
                const slug = item?.slug
                const routeKey = slug || item?.id
                const name = item?.full_name || item?.name || 'Unnamed'
                const role = item?.title || item?.role || item?.position

                return (
                  <RevealItem key={item?.id || slug || name}>
                    <Card className="group flex h-full flex-col rounded-2xl border border-border/70 bg-surface shadow-sm">
                      <div className="p-4 pb-0">
                        <CmsCardImage
                          src={thumbnail}
                          alt={`${name} portrait`}
                          ratio="4/5"
                          className="rounded-2xl bg-muted"
                          imgClassName="transform-gpu transition-transform duration-200 ease-out group-hover:scale-[1.03]"
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
                          <DetailPageCTA
                            to={routeKey ? `/hall-of-fame/${routeKey}` : undefined}
                            label="Read more"
                            size="md"
                            className="mt-auto rounded-full px-4 py-2 text-sm font-medium [&>span]:gap-0 [&>span>span:first-child]:hidden"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </RevealItem>
                )
              })}
            </StaggerGridReveal>
          )}
        </StateGate>
      </div>
    </section>
  )
}

export default HallOfFameList
