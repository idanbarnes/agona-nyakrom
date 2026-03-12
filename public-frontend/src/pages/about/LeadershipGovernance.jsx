import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getPublicLeaders } from '../../api/endpoints.js'
import CmsCardImage from '../../components/media/CmsCardImage.jsx'
import AnimatedHeroIntro from '../../components/motion/AnimatedHeroIntro.jsx'
import RevealItem from '../../components/motion/RevealItem.jsx'
import StaggerGridReveal from '../../components/motion/StaggerGridReveal.jsx'
import { Button, DetailPageCTA, EmptyState, Input } from '../../components/ui/index.jsx'

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

function RoleTitleIcon({ className = 'h-4 w-4' }) {
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
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  )
}

function CrownIcon({ className = 'h-4 w-4' }) {
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
      <path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z" />
      <path d="M7 19h10" />
    </svg>
  )
}

function ArrowUpRightIcon({ className = 'h-4 w-4' }) {
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
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

function matchesSearch(value, normalizedSearch) {
  if (!normalizedSearch) {
    return true
  }

  return String(value || '').toLowerCase().includes(normalizedSearch)
}

function matchesLeaderSearch(leader, normalizedSearch) {
  if (!normalizedSearch) {
    return true
  }

  return [
    leader?.name,
    leader?.role_title,
    leader?.short_bio_snippet,
    leader?.full_bio,
  ].some((value) => matchesSearch(value, normalizedSearch))
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getLeaderSnippet(leader) {
  const shortBio = String(leader?.short_bio_snippet || '').trim()
  if (shortBio) {
    return shortBio
  }

  const fullBio = stripHtml(leader?.full_bio || '')
  return fullBio ? fullBio.slice(0, 180) : ''
}

function getLeaderCategoryMeta(leader, compact) {
  const category = leader?.category || (compact ? 'community_admin' : 'traditional')

  if (category === 'community_admin') {
    return {
      label: 'Community Admin',
      badgeClassName:
        'border-emerald-200/80 bg-white/88 text-emerald-800 shadow-[0_8px_18px_rgba(5,150,105,0.12)]',
      frameClassName:
        'bg-[linear-gradient(180deg,rgba(237,252,245,0.95),rgba(255,255,255,0.92))]',
    }
  }

  return {
    label: 'Traditional Leadership',
    badgeClassName:
      'border-amber-200/80 bg-white/88 text-amber-800 shadow-[0_8px_18px_rgba(180,83,9,0.14)]',
    frameClassName:
      'bg-[linear-gradient(180deg,rgba(255,247,235,0.95),rgba(255,255,255,0.92))]',
  }
}

function LeaderCard({ leader, compact = false }) {
  const snippet = getLeaderSnippet(leader)
  const categoryMeta = getLeaderCategoryMeta(leader, compact)
  const isTraditional = categoryMeta.label === 'Traditional Leadership'
  const contentStyle = {
    display: '-webkit-box',
    WebkitLineClamp: compact ? 3 : 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,243,236,0.94))] shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-border hover:shadow-[0_22px_46px_rgba(15,23,42,0.13)]"
    >
      <div className="relative p-3 pb-0">
        <div
          className={`overflow-hidden rounded-[1.25rem] border border-border/60 p-2 ${categoryMeta.frameClassName}`}
        >
          <CmsCardImage
            src={leader.photo}
            alt={leader.name || leader.role_title || 'Leader'}
            ratio="4/5"
            className="rounded-[1rem] bg-muted/50"
            imgClassName="transform-gpu transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <div className="space-y-3">
          <h3
            className={`font-semibold leading-tight tracking-tight text-foreground ${
              compact ? 'text-lg' : 'text-[1.35rem]'
            }`}
          >
            {leader.name || 'Leadership profile'}
          </h3>
          {leader.role_title ? (
            <div className="inline-flex w-full items-start gap-2 rounded-2xl border border-border/70 bg-background/65 px-3 py-2 text-sm text-foreground/85">
              {isTraditional ? (
                <CrownIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              ) : (
                <RoleTitleIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span>{leader.role_title}</span>
            </div>
          ) : null}
        </div>

        {snippet ? (
          <p className="text-sm leading-6 text-muted-foreground" style={contentStyle}>
            {snippet}
          </p>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Open the profile to read more about this leader.
          </p>
        )}

        <DetailPageCTA
          to={`/about/leadership-governance/${leader.slug || leader.id}`}
          label="View Profile"
          size={compact ? 'sm' : 'md'}
          icon={<ArrowUpRightIcon className="h-4 w-4" />}
          className="mt-auto w-full justify-center rounded-xl text-sm font-semibold"
        />
      </div>
    </article>
  )
}

export default function LeadershipGovernance() {
  const [data, setData] = useState({ traditional: [], community_admin: [] })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    getPublicLeaders()
      .then((res) => setData(res.data || res))
      .catch(() => {})
  }, [])

  const deferredSearchTerm = useDeferredValue(searchTerm)
  const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
  const totalLeaders = data.traditional.length + data.community_admin.length

  const filteredTraditional = useMemo(
    () =>
      data.traditional.filter((leader) =>
        matchesLeaderSearch(leader, normalizedSearch),
      ),
    [data.traditional, normalizedSearch],
  )
  const filteredCommunityAdmin = useMemo(
    () =>
      data.community_admin.filter((leader) =>
        matchesLeaderSearch(leader, normalizedSearch),
      ),
    [data.community_admin, normalizedSearch],
  )
  const totalMatches = filteredTraditional.length + filteredCommunityAdmin.length

  return (
    <section className="container py-6 md:py-10">
      <div className="overflow-hidden rounded-[2rem] border border-[#D8E4D9] bg-[radial-gradient(circle_at_top_left,_rgba(21,128,61,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(180,83,9,0.12),_transparent_36%),linear-gradient(135deg,_#f8fcf8_0%,_#fffdf7_48%,_#eef5ef_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)] lg:items-center lg:px-10 lg:py-10">
          <AnimatedHeroIntro
            className="space-y-5"
            entry="left"
            visualEntry="up"
            headline={
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white/85 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-emerald-700 shadow-sm backdrop-blur">
                  Public Leadership Directory
                </span>
                <div className="space-y-3">
                  <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-tight text-stone-950 sm:text-5xl lg:text-[3.7rem]">
                    Leadership and governance, organised in one place.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                    Explore traditional and community administrative leaders, then
                    search the directory by name, role, or biography snippet.
                  </p>
                </div>
              </div>
            }
            subtext={
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Directory
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {totalLeaders} leaders listed
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Traditional
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {data.traditional.length} profiles
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Search
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {normalizedSearch
                      ? `${totalMatches} match${totalMatches === 1 ? '' : 'es'}`
                      : 'Browse all leaders'}
                  </p>
                </div>
              </div>
            }
            actions={
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    as="a"
                    href="#leadership-directory"
                    className="rounded-full border-transparent bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Browse Directory
                  </Button>
                  <p className="text-sm text-stone-500">
                    Search across names, roles, and leader summaries.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-100 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
                  <label
                    htmlFor="leadership-search"
                    className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-stone-500"
                  >
                    Search Leadership Directory
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        id="leadership-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name, title, or keyword"
                        aria-label="Search leadership directory"
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
                <div className="pointer-events-none absolute -left-6 top-6 h-24 w-24 rounded-full bg-emerald-200/50 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-200/35 blur-2xl" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:col-span-2">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Directory Overview
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                          Total
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                          {totalLeaders}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                          Traditional
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                          {data.traditional.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                          Admin
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                          {data.community_admin.length}
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-[1.5rem] border border-white/80 bg-[#f4fbf4] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-stone-400">
                      Traditional Leadership
                    </p>
                    <p className="mt-3 text-lg font-semibold leading-7 text-stone-950">
                      Custodians of customary authority and traditional governance.
                    </p>
                  </article>

                  <article className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-stone-400">
                      Community Administration
                    </p>
                    <p className="mt-3 text-lg font-semibold leading-7 text-stone-950">
                      Public-facing administrative leaders supporting local coordination.
                    </p>
                  </article>
                </div>
              </div>
            }
          />
        </div>
      </div>

      <div className="mt-10 space-y-10" id="leadership-directory">
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Traditional Leadership
            </h2>
            <p className="text-sm text-muted-foreground">
              Leaders within the traditional governance structure.
            </p>
          </div>
          {filteredTraditional.length ? (
            <StaggerGridReveal className="grid gap-4 md:grid-cols-3">
              {filteredTraditional.map((leader) => (
                <RevealItem key={leader.id}>
                  <LeaderCard leader={leader} />
                </RevealItem>
              ))}
            </StaggerGridReveal>
          ) : (
            <EmptyState
              title={
                normalizedSearch
                  ? 'No matching traditional leaders.'
                  : 'No traditional leaders available.'
              }
              description={
                normalizedSearch
                  ? `No traditional leader matched "${searchTerm.trim()}".`
                  : 'Profiles will appear here when published.'
              }
              action={
                normalizedSearch ? (
                  <Button variant="secondary" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                ) : null
              }
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Community Administrative Leadership
            </h2>
            <p className="text-sm text-muted-foreground">
              Administrative and community leadership profiles.
            </p>
          </div>
          {filteredCommunityAdmin.length ? (
            <StaggerGridReveal className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {filteredCommunityAdmin.map((leader) => (
                <RevealItem key={leader.id}>
                  <LeaderCard leader={leader} compact />
                </RevealItem>
              ))}
            </StaggerGridReveal>
          ) : (
            <EmptyState
              title={
                normalizedSearch
                  ? 'No matching administrative leaders.'
                  : 'No administrative leaders available.'
              }
              description={
                normalizedSearch
                  ? `No administrative leader matched "${searchTerm.trim()}".`
                  : 'Profiles will appear here when published.'
              }
              action={
                normalizedSearch ? (
                  <Button variant="secondary" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                ) : null
              }
            />
          )}
        </section>
      </div>
    </section>
  )
}
