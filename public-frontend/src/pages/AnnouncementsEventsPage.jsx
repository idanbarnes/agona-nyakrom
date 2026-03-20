import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  getAnnouncementsEvents,
  getPublicAnnouncements,
  getPublicEvents,
} from '../api/endpoints.js'
import AnimatedHeroIntro from '../components/motion/AnimatedHeroIntro.jsx'
import ImageLightbox from '../components/ImageLightbox.jsx'
import RevealItem from '../components/motion/RevealItem.jsx'
import StaggerGridReveal from '../components/motion/StaggerGridReveal.jsx'
import { resolveAssetUrl } from '../lib/apiBase.js'
import {
  buildAnnouncementDetailPath,
  buildEventDetailPath,
} from './announcementsEventsPaths.js'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardSkeleton,
  DetailPageCTA,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  Input,
  StateGate,
} from '../components/ui/index.jsx'
import { buildIcsEvent, downloadIcs, hasCalendarDate } from '../utils/calendar.js'
import { downloadRemoteFile, openFileFallback } from '../utils/download.js'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'coming_soon', label: 'Coming Soon' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
]

const DEFAULT_PAST_LIMIT = 6

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

function formatDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeEventState(event) {
  const state = event?.state
  if (state) {
    return String(state).toUpperCase()
  }

  if (!event?.event_date) {
    return 'COMING_SOON'
  }

  const today = new Date()
  const eventDate = new Date(event.event_date)
  if (Number.isNaN(eventDate.getTime())) {
    return 'COMING_SOON'
  }

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const eventStart = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  )

  return eventStart.getTime() >= todayStart.getTime() ? 'UPCOMING' : 'PAST'
}

function extractPayload(response) {
  if (!response) return null
  return response?.data || response
}

function buildEventGroups(events = []) {
  const comingSoon = []
  const upcoming = []
  const past = []

  events.forEach((event) => {
    const state = normalizeEventState(event)
    if (state === 'COMING_SOON') {
      comingSoon.push(event)
    } else if (state === 'UPCOMING') {
      upcoming.push(event)
    } else {
      past.push(event)
    }
  })

  return { comingSoon, upcoming, past }
}

function getEventSlug(event) {
  return event?.slug || event?.id || 'event'
}

function matchesSearch(value, normalizedSearch) {
  if (!normalizedSearch) {
    return true
  }

  const haystack = String(value || '').toLowerCase()
  return haystack.includes(normalizedSearch)
}

function matchesEventSearch(event, normalizedSearch) {
  if (!normalizedSearch) {
    return true
  }

  return [
    event?.title,
    event?.event_tag,
    event?.excerpt,
    event?.body,
  ].some((value) => matchesSearch(value, normalizedSearch))
}

function matchesAnnouncementSearch(item, normalizedSearch) {
  if (!normalizedSearch) {
    return true
  }

  return [item?.title, item?.excerpt, item?.body].some((value) =>
    matchesSearch(value, normalizedSearch),
  )
}

function EventImage({ event }) {
  const flyer = event?.flyer_image_path
  const title = event?.title || 'Event flyer'

  if (!flyer) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-t-lg bg-muted text-muted-foreground">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          aria-hidden="true"
          className="text-muted-foreground"
        >
          <path
            d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2v10h16V7H4Zm2 2h5v3H6V9Zm0 4h9v2H6v-2Z"
            fill="currentColor"
          />
        </svg>
      </div>
    )
  }

  return (
    <ImageWithFallback
      src={resolveAssetUrl(flyer)}
      alt={event?.flyer_alt_text || `${title} flyer`}
      className="h-full w-full transform-gpu rounded-t-lg object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
      fallbackText={title}
    />
  )
}

function EventCard({
  event,
  variant = 'compact',
  showCalendar,
  onPreviewImage,
}) {
  const slug = getEventSlug(event)
  const dateLabel = formatDate(event?.event_date)
  const hasFlyer = Boolean(event?.flyer_image_path)
  const flyerUrl = hasFlyer ? resolveAssetUrl(event.flyer_image_path) : ''
  const [flyerDownloading, setFlyerDownloading] = useState(false)
  const canAddToCalendar = showCalendar && hasCalendarDate(event?.event_date)

  const handleCalendar = () => {
    if (!canAddToCalendar) {
      return
    }

    const eventUrl =
      typeof window !== 'undefined'
        ? new URL(buildEventDetailPath(slug), window.location.origin).toString()
        : ''
    const ics = buildIcsEvent({
      title: event?.title || 'Community Event',
      description: event?.excerpt || event?.body || '',
      date: event?.event_date,
      uid: `${slug}@agona-nyakrom`,
      url: eventUrl,
      isAllDay: true,
    })

    downloadIcs({ filename: `event-${slug}.ics`, content: ics })
  }

  const handleFlyerDownload = async () => {
    if (!flyerUrl || flyerDownloading) {
      return
    }

    setFlyerDownloading(true)

    try {
      await downloadRemoteFile({
        url: flyerUrl,
        filename: event?.slug ? `event-${event.slug}` : event?.title || 'event-flyer',
        fallbackBaseName: 'event-flyer',
      })
    } catch {
      openFileFallback(flyerUrl)
    } finally {
      setFlyerDownloading(false)
    }
  }

  const contentStyle = {
    display: '-webkit-box',
    WebkitLineClamp: variant === 'compact' ? 2 : 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border/70 shadow-sm">
      <div className="aspect-[16/9] w-full overflow-hidden">
        {hasFlyer ? (
          <button
            type="button"
            onClick={() =>
              onPreviewImage?.({
                src: flyerUrl,
                alt: event?.flyer_alt_text || `${event?.title || 'Event'} flyer`,
                caption: event?.title || 'Event flyer',
              })
            }
            aria-label={`View image for ${event?.title || 'this event'}`}
            className="h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <EventImage event={event} />
          </button>
        ) : (
          <EventImage event={event} />
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {event?.title || 'Untitled event'}
            </h3>
            {event?.event_tag ? (
              <Badge variant="muted">{event.event_tag}</Badge>
            ) : null}
          </div>
          {dateLabel ? (
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          ) : null}
        </div>
        {event?.excerpt || event?.body ? (
          <p
            className="text-sm text-muted-foreground"
            style={contentStyle}
          >
            {event?.excerpt || event?.body}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-start gap-2">
        {canAddToCalendar ? (
          <Button variant="secondary" size="sm" onClick={handleCalendar}>
            Add to Calendar
          </Button>
        ) : null}
        {hasFlyer ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFlyerDownload}
            loading={flyerDownloading}
            disabled={flyerDownloading}
          >
            Download Flyer
          </Button>
        ) : null}
        <DetailPageCTA to={buildEventDetailPath(slug)} label="View Details" />
      </CardFooter>
    </Card>
  )
}

function AnnouncementCard({ item, onPreviewImage }) {
  const hasFlyer = Boolean(item?.flyer_image_path)
  const dateLabel = formatDate(item?.created_at || item?.published_at)
  const slug = item?.slug || item?.id || 'announcement'
  const flyerUrl = hasFlyer ? resolveAssetUrl(item.flyer_image_path) : ''

  const contentStyle = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border/70 shadow-sm">
      {hasFlyer ? (
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() =>
              onPreviewImage?.({
                src: flyerUrl,
                alt: item?.flyer_alt_text || `${item?.title || 'Announcement'} flyer`,
                caption: item?.title || 'Announcement flyer',
              })
            }
            aria-label={`View image for ${item?.title || 'this announcement'}`}
            className="h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ImageWithFallback
              src={flyerUrl}
              alt={item?.flyer_alt_text || `${item?.title || 'Announcement'} flyer`}
              className="h-40 w-full transform-gpu object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
              fallbackText={item?.title || 'Announcement'}
            />
          </button>
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-muted text-muted-foreground">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
              className="text-muted-foreground"
            >
              <path
                d="M5 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Zm2 2v12h8V6H7Zm11 4h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v-2h1v-4h-1v-2Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">
            {item?.title || 'Untitled announcement'}
          </h3>
          {dateLabel ? (
            <p className="text-xs text-muted-foreground">Posted {dateLabel}</p>
          ) : null}
        </div>
        {item?.excerpt || item?.body ? (
          <p className="text-sm text-muted-foreground" style={contentStyle}>
            {item?.excerpt || item?.body}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-start">
        <DetailPageCTA to={buildAnnouncementDetailPath(slug)} label="View Details" />
      </CardFooter>
    </Card>
  )
}

function AnnouncementsEventsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [events, setEvents] = useState({
    comingSoon: [],
    upcoming: [],
    past: [],
  })
  const [announcements, setAnnouncements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAllPast, setShowAllPast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getAnnouncementsEvents({
          events_limit: 20,
          announcements_limit: 20,
          coming_soon_limit: 20,
          upcoming_limit: 20,
          past_limit: 20,
        })

        if (!isMounted) return

        const payload = extractPayload(response)
        if (payload?.events && payload?.announcements) {
          setEvents({
            comingSoon: payload.events.comingSoon || [],
            upcoming: payload.events.upcoming || [],
            past: payload.events.past || [],
          })
          setAnnouncements(payload.announcements || [])
          return
        }

        throw new Error('Invalid response')
      } catch {
        try {
          const [eventsResponse, announcementsResponse] = await Promise.all([
            getPublicEvents({ state: 'all', limit: 50 }),
            getPublicAnnouncements({ limit: 20 }),
          ])

          if (!isMounted) return

          const eventsPayload = extractPayload(eventsResponse)
          const announcementsPayload = extractPayload(announcementsResponse)

          const eventsList = Array.isArray(eventsPayload)
            ? eventsPayload
            : eventsPayload?.items || eventsPayload?.events || []

          setEvents(buildEventGroups(eventsList))
          setAnnouncements(
            Array.isArray(announcementsPayload)
              ? announcementsPayload
              : announcementsPayload?.items ||
                  announcementsPayload?.announcements ||
                  [],
          )
        } catch (fallbackError) {
          if (isMounted) {
            setError(fallbackError)
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const hasEvents = useMemo(
    () =>
      events.comingSoon.length || events.upcoming.length || events.past.length,
    [events],
  )
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
  const totalEventsCount =
    events.comingSoon.length + events.upcoming.length + events.past.length
  const totalAnnouncementsCount = announcements.length

  const visibleComingSoon =
    activeTab === 'all' || activeTab === 'coming_soon'
      ? events.comingSoon.filter((event) =>
          matchesEventSearch(event, normalizedSearch),
        )
      : []
  const visibleUpcoming =
    activeTab === 'all' || activeTab === 'upcoming'
      ? events.upcoming.filter((event) => matchesEventSearch(event, normalizedSearch))
      : []
  const visiblePast =
    activeTab === 'all' || activeTab === 'past'
      ? events.past.filter((event) => matchesEventSearch(event, normalizedSearch))
      : []

  const visibleAnnouncements = useMemo(
    () =>
      announcements.filter((item) =>
        matchesAnnouncementSearch(item, normalizedSearch),
      ),
    [announcements, normalizedSearch],
  )

  const pastVisibleItems = showAllPast
    ? visiblePast
    : visiblePast.slice(0, DEFAULT_PAST_LIMIT)
  const filteredEventsCount =
    visibleComingSoon.length + visibleUpcoming.length + visiblePast.length
  const searchResultLabel = normalizedSearch
    ? `${filteredEventsCount + visibleAnnouncements.length} result${
        filteredEventsCount + visibleAnnouncements.length === 1 ? '' : 's'
      }`
    : 'Search events and announcements'

  useEffect(() => {
    setShowAllPast(false)
  }, [activeTab, normalizedSearch])

  return (
    <section className="container py-8 md:py-12">
      <div className="overflow-hidden rounded-[2rem] border border-[#E8D7BE] bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(120,53,15,0.12),_transparent_34%),linear-gradient(135deg,_#fffaf2_0%,_#fffefb_48%,_#f5ede1_100%)] shadow-[0_24px_60px_rgba(120,53,15,0.12)]">
        <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)] lg:items-center lg:px-10 lg:py-10">
          <AnimatedHeroIntro
            className="space-y-5"
            entry="left"
            visualEntry="up"
            headline={
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-white/85 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-amber-700 shadow-sm backdrop-blur">
                  Community Updates
                </span>
                <div className="space-y-3">
                  <h1 className="max-w-2xl break-words text-4xl font-semibold leading-[0.95] tracking-tight text-stone-950 sm:text-5xl lg:text-[3.7rem]">
                    Announcements and events in one clear community hub.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                    Browse official notices, upcoming gatherings, and past events,
                    then search the list to jump directly to what matters.
                  </p>
                </div>
              </div>
            }
            subtext={
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-amber-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Events
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {loading ? 'Loading events' : `${totalEventsCount} listed`}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white/75 px-4 py-3 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Announcements
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {loading
                      ? 'Loading updates'
                      : `${totalAnnouncementsCount} posted`}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white/75 px-4 py-3 shadow-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Search
                  </p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {searchResultLabel}
                  </p>
                </div>
              </div>
            }
            actions={
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    as="a"
                    href="#announcements-events-content"
                    className="rounded-full border-transparent bg-amber-700 px-5 text-sm font-semibold text-white hover:bg-amber-800"
                  >
                    Browse Updates
                  </Button>
                  <p className="text-sm text-stone-500">
                    Search titles, tags, and descriptions across the page.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-amber-100 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
                  <label
                    htmlFor="announcements-events-search"
                    className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-stone-500"
                  >
                    Search Announcements and Events
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        id="announcements-events-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by title, tag, or keyword"
                        aria-label="Search announcements and events"
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
                <div className="pointer-events-none absolute -left-6 top-6 h-24 w-24 rounded-full bg-amber-200/45 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-stone-300/35 blur-2xl" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <article className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(120,53,15,0.16)] sm:col-span-2">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-amber-700">
                      Browse by event status
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {TABS.map((tab) => (
                        <span
                          key={`hero-${tab.key}`}
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                            activeTab === tab.key
                              ? 'bg-amber-700 text-white'
                              : 'border border-stone-200 bg-stone-50 text-stone-700'
                          }`}
                        >
                          {tab.label}
                        </span>
                      ))}
                    </div>
                  </article>

                  <article className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-[#fff7ea] p-5 shadow-[0_16px_34px_rgba(120,53,15,0.12)]">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-stone-400">
                      Coming soon
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                      {loading ? '...' : events.comingSoon.length}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Early previews of community gatherings and activities.
                    </p>
                  </article>

                  <article className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_16px_34px_rgba(120,53,15,0.12)]">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-stone-400">
                      Upcoming
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                      {loading ? '...' : events.upcoming.length}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Events with confirmed dates ready to explore in full.
                    </p>
                  </article>
                </div>
              </div>
            }
          />
        </div>
      </div>

      <div className="mt-8 space-y-12" id="announcements-events-content">
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Events</h2>
              <p className="text-sm text-muted-foreground">
                Filter by event timeline and search within the current list.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  variant={activeTab === tab.key ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  aria-pressed={activeTab === tab.key}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <StateGate
            loading={loading}
            error={error}
            isEmpty={!loading && !error && !hasEvents}
            skeleton={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CardSkeleton key={`events-skeleton-${index}`} />
                ))}
              </div>
            }
            errorFallback={
              <ErrorState message={error?.message || 'Unable to load events.'} />
            }
            empty={
              <EmptyState
                title="No events published yet."
                description="Check back soon for upcoming community gatherings."
              />
            }
          >
            {filteredEventsCount === 0 ? (
              <EmptyState
                title={
                  normalizedSearch ? 'No matching events found.' : 'No events published yet.'
                }
                description={
                  normalizedSearch
                    ? `No event matched "${searchTerm.trim()}". Try another keyword or clear the search.`
                    : 'Check back soon for upcoming community gatherings.'
                }
                action={
                  normalizedSearch ? (
                    <Button variant="secondary" onClick={() => setSearchTerm('')}>
                      Clear search
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className="space-y-10">
              {visibleComingSoon.length ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Coming Soon
                  </h2>
                  <StaggerGridReveal className="grid gap-6 sm:grid-cols-2">
                    {visibleComingSoon.map((event) => (
                      <RevealItem key={event.id || event.slug || event.title}>
                        <EventCard
                          event={event}
                          variant="compact"
                          showCalendar
                          onPreviewImage={setPreviewImage}
                        />
                      </RevealItem>
                    ))}
                  </StaggerGridReveal>
                </div>
              ) : null}

              {visibleUpcoming.length ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Upcoming</h2>
                  <StaggerGridReveal className="grid gap-6 lg:grid-cols-2">
                    {visibleUpcoming.map((event) => (
                      <RevealItem key={event.id || event.slug || event.title}>
                        <EventCard
                          event={event}
                          variant="large"
                          showCalendar
                          onPreviewImage={setPreviewImage}
                        />
                      </RevealItem>
                    ))}
                  </StaggerGridReveal>
                </div>
              ) : null}

              {visiblePast.length ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Past Events
                  </h2>
                  <StaggerGridReveal className="grid gap-6 sm:grid-cols-2">
                    {pastVisibleItems.map((event) => (
                      <RevealItem key={event.id || event.slug || event.title}>
                        <EventCard
                          event={event}
                          variant="compact"
                          showCalendar={false}
                          onPreviewImage={setPreviewImage}
                        />
                      </RevealItem>
                    ))}
                  </StaggerGridReveal>
                  {visiblePast.length > DEFAULT_PAST_LIMIT ? (
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowAllPast((current) => !current)}
                      >
                        {showAllPast
                          ? 'Show less'
                          : 'Show more past events'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              </div>
            )}
          </StateGate>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
          </div>

          <StateGate
            loading={loading}
            error={error}
            isEmpty={!loading && !error && announcements.length === 0}
            skeleton={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CardSkeleton key={`announcements-skeleton-${index}`} />
                ))}
              </div>
            }
            errorFallback={
              <ErrorState
                message={error?.message || 'Unable to load announcements.'}
              />
            }
            empty={
              <EmptyState
                title="No announcements at the moment."
                description="Please check back soon for updates."
              />
            }
          >
            {visibleAnnouncements.length === 0 ? (
              <EmptyState
                title={
                  normalizedSearch
                    ? 'No matching announcements found.'
                    : 'No announcements at the moment.'
                }
                description={
                  normalizedSearch
                    ? `No announcement matched "${searchTerm.trim()}". Try another keyword or clear the search.`
                    : 'Please check back soon for updates.'
                }
                action={
                  normalizedSearch ? (
                    <Button variant="secondary" onClick={() => setSearchTerm('')}>
                      Clear search
                    </Button>
                  ) : null
                }
              />
            ) : (
              <StaggerGridReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleAnnouncements.map((item) => (
                  <RevealItem key={item.id || item.slug || item.title}>
                    <AnnouncementCard
                      item={item}
                      onPreviewImage={setPreviewImage}
                    />
                  </RevealItem>
                ))}
              </StaggerGridReveal>
            )}
          </StateGate>
        </section>
      </div>

      {previewImage?.src ? (
        <ImageLightbox
          open={Boolean(previewImage?.src)}
          onClose={() => setPreviewImage(null)}
          src={previewImage.src}
          alt={previewImage.alt}
          caption={previewImage.caption}
        />
      ) : null}
    </section>
  )
}

export default AnnouncementsEventsPage
