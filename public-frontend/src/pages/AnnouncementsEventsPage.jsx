import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAnnouncementsEvents,
  getPublicAnnouncements,
  getPublicEvents,
} from '../api/endpoints.js'
import ImageLightbox from '../components/ImageLightbox.jsx'
import RevealItem from '../components/motion/RevealItem.jsx'
import StaggerGridReveal from '../components/motion/StaggerGridReveal.jsx'
import { resolveAssetUrl } from '../lib/apiBase.js'
import { trackSearch } from '../lib/analytics.js'
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

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'coming_soon', label: 'Coming Soon' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
]

const DEFAULT_PAST_LIMIT = 6
const EVENT_GRID_CLASS =
  'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
const ANNOUNCEMENT_GRID_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5'

const VIEW_CONTENT = {
  announcements: {
    title: 'Announcements',
    description:
      'Official updates, public notices, and important information from Agona Nyakrom community leadership and bodies.',
    searchLabel: 'Search Announcements',
    searchAriaLabel: 'Search announcements',
    searchIdleLabel: 'Search announcement notices',
    searchPlaceholder: 'Search notices by title or keyword',
    showEvents: false,
    showAnnouncements: true,
  },
  events: {
    title: 'Events',
    description:
      'Upcoming and recent community programs, ceremonies, meetings, gatherings, and scheduled activities.',
    searchLabel: 'Search Events',
    searchAriaLabel: 'Search events',
    searchIdleLabel: 'Search events',
    searchPlaceholder: 'Search events by title, tag, or keyword',
    showEvents: true,
    showAnnouncements: false,
  },
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

function PageHeader({
  title,
  description,
  countLabel,
  searchLabel,
  searchAriaLabel,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  onClearSearch,
}) {
  return (
    <header className="border-b border-border/70 bg-surface">
      <div className="container py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(320px,420px)] lg:items-end">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Community Information
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              {description}
            </p>
            <p className="text-sm font-medium text-foreground">{countLabel}</p>
          </div>

          <div className="rounded-lg border border-border/70 bg-background p-4">
            <label
              htmlFor="announcements-events-search"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {searchLabel}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="announcements-events-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchAriaLabel}
                  className="h-11 pl-10"
                />
              </div>
              {searchTerm ? (
                <Button variant="secondary" onClick={onClearSearch}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
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
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
        Event
      </div>
    )
  }

  return (
    <ImageWithFallback
      src={resolveAssetUrl(flyer)}
      alt={event?.flyer_alt_text || `${title} flyer`}
      className="h-full w-full transform-gpu object-contain p-2 transition-transform duration-200 ease-out group-hover:scale-[1.01]"
      fallbackText={title}
    />
  )
}

function EventCard({ event, onPreviewImage }) {
  const slug = getEventSlug(event)
  const dateLabel = formatDate(event?.event_date)
  const displayDateLabel = dateLabel || 'Date to be announced'
  const hasFlyer = Boolean(event?.flyer_image_path)
  const flyerUrl = hasFlyer ? resolveAssetUrl(event.flyer_image_path) : ''

  const titleStyle = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  return (
    <Card className="group flex h-full min-h-[29rem] flex-col overflow-hidden border-border/80 bg-surface shadow-sm transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg motion-reduce:transform-none">
      <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-border/70 bg-muted sm:aspect-[4/5]">
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

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 space-y-2">
          <h3
            className="text-lg font-semibold leading-snug text-foreground"
            style={titleStyle}
          >
            {event?.title || 'Untitled event'}
          </h3>
          {event?.event_date ? (
            <time
              dateTime={event.event_date}
              className="inline-flex rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold leading-5 text-primary"
            >
              {displayDateLabel}
            </time>
          ) : (
            <span className="inline-flex rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold leading-5 text-primary">
              {displayDateLabel}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex justify-start border-t border-border/60 px-4 py-3">
        <DetailPageCTA to={buildEventDetailPath(slug)} label="View details" />
      </CardFooter>
    </Card>
  )
}

function AnnouncementCard({ item, onPreviewImage }) {
  const hasFlyer = Boolean(item?.flyer_image_path)
  const dateLabel = formatDate(item?.created_at || item?.published_at)
  const slug = item?.slug || item?.id || 'announcement'
  const flyerUrl = hasFlyer ? resolveAssetUrl(item.flyer_image_path) : ''

  const titleStyle = {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  return (
    <Card className="group relative flex h-full min-h-[27rem] flex-col overflow-hidden border-border/80 bg-surface shadow-[0_14px_36px_-28px_rgba(15,23,42,0.45)] transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_22px_46px_-30px_rgba(15,23,42,0.55)]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-[#D97706]"
      />
      {hasFlyer ? (
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
          className="aspect-[3/4] w-full cursor-zoom-in overflow-hidden border-b border-border/70 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:aspect-[4/5]"
        >
          <ImageWithFallback
            src={flyerUrl}
            alt={item?.flyer_alt_text || `${item?.title || 'Announcement'} flyer`}
            className="h-full w-full transform-gpu object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-[1.01]"
            fallbackText={item?.title || 'Announcement'}
          />
        </button>
      ) : null}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <h3
            className="text-base font-semibold leading-snug text-foreground sm:text-[1.05rem]"
            style={titleStyle}
          >
            {item?.title || 'Untitled announcement'}
          </h3>
          {dateLabel ? (
            <p className="text-xs font-medium leading-5 text-muted-foreground">
              Published {dateLabel}
            </p>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="mt-auto border-t border-border/60 px-4 py-3">
        <DetailPageCTA
          to={buildAnnouncementDetailPath(slug)}
          label="Read more"
          className="w-full justify-center sm:w-auto"
        />
      </CardFooter>
    </Card>
  )
}

function AnnouncementsEventsPage() {
  const [searchParams] = useSearchParams()
  const requestedView = searchParams.get('view')
  const pageView = VIEW_CONTENT[requestedView] ? requestedView : 'announcements'
  const viewContent = VIEW_CONTENT[pageView]
  const showEvents = viewContent.showEvents
  const showAnnouncements = viewContent.showAnnouncements
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
  const visibleResultCount =
    (showEvents ? filteredEventsCount : 0) +
    (showAnnouncements ? visibleAnnouncements.length : 0)
  const searchResultLabel = normalizedSearch
    ? `${visibleResultCount} result${visibleResultCount === 1 ? '' : 's'}`
    : viewContent.searchIdleLabel
  const headerCountLabel = loading
    ? `Loading ${pageView}...`
    : pageView === 'events'
      ? `${totalEventsCount} event${totalEventsCount === 1 ? '' : 's'} listed`
      : `${totalAnnouncementsCount} announcement${
          totalAnnouncementsCount === 1 ? '' : 's'
        } posted`

  useEffect(() => {
    if (!normalizedSearch || loading) return undefined
    const timer = window.setTimeout(() => {
      trackSearch({
        query: normalizedSearch,
        resultCount: visibleResultCount,
        contentType: pageView === 'announcements' ? 'announcement' : 'event',
      })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [loading, normalizedSearch, pageView, visibleResultCount])

  useEffect(() => {
    setShowAllPast(false)
  }, [activeTab, normalizedSearch])

  return (
    <section className="bg-background">
      <PageHeader
        title={viewContent.title}
        description={viewContent.description}
        countLabel={normalizedSearch ? searchResultLabel : headerCountLabel}
        searchLabel={viewContent.searchLabel}
        searchAriaLabel={viewContent.searchAriaLabel}
        searchPlaceholder={viewContent.searchPlaceholder}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
      />

      <div
        className="container space-y-12 py-8 md:py-10"
        id="announcements-events-content"
      >
        {showEvents ? (
          <section className="space-y-6" aria-labelledby="events-list-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2
                  id="events-list-heading"
                  className="text-xl font-semibold text-foreground"
                >
                  Community events
                </h2>
                <p className="text-sm text-muted-foreground">
                  Filter events by timeline. Dates are shown when available.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2" aria-label="Event status filter">
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
                <div className={EVENT_GRID_CLASS}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <CardSkeleton key={`events-skeleton-${index}`} />
                  ))}
                </div>
              }
              errorFallback={
                <ErrorState message="Events could not be loaded right now. Please try again later." />
              }
              empty={
                <EmptyState
                  title="No events published yet."
                  description="Upcoming community events will appear here when they are available."
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
                      : 'Upcoming community events will appear here when they are available.'
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
                      <h3 className="text-lg font-semibold text-foreground">
                        Date to be announced
                      </h3>
                      <StaggerGridReveal className={EVENT_GRID_CLASS}>
                        {visibleComingSoon.map((event) => (
                          <RevealItem
                            key={event.id || event.slug || event.title}
                            className="h-full"
                          >
                            <EventCard
                              event={event}
                              onPreviewImage={setPreviewImage}
                            />
                          </RevealItem>
                        ))}
                      </StaggerGridReveal>
                    </div>
                  ) : null}

                  {visibleUpcoming.length ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Upcoming
                      </h3>
                      <StaggerGridReveal className={EVENT_GRID_CLASS}>
                        {visibleUpcoming.map((event) => (
                          <RevealItem
                            key={event.id || event.slug || event.title}
                            className="h-full"
                          >
                            <EventCard
                              event={event}
                              onPreviewImage={setPreviewImage}
                            />
                          </RevealItem>
                        ))}
                      </StaggerGridReveal>
                    </div>
                  ) : null}

                  {visiblePast.length ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Past events
                      </h3>
                      <StaggerGridReveal className={EVENT_GRID_CLASS}>
                        {pastVisibleItems.map((event) => (
                          <RevealItem
                            key={event.id || event.slug || event.title}
                            className="h-full"
                          >
                            <EventCard
                              event={event}
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
                            {showAllPast ? 'Show less' : 'Show more past events'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </StateGate>
          </section>
        ) : null}

        {showAnnouncements ? (
          <section className="space-y-6" aria-labelledby="announcements-list-heading">
            <div className="space-y-1">
              <h2
                id="announcements-list-heading"
                className="text-xl font-semibold text-foreground"
              >
                Official notices
              </h2>
              <p className="text-sm text-muted-foreground">
                Published community announcements and administrative updates.
              </p>
            </div>

            <StateGate
              loading={loading}
              error={error}
              isEmpty={!loading && !error && announcements.length === 0}
              skeleton={
                <div className={ANNOUNCEMENT_GRID_CLASS}>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CardSkeleton key={`announcements-skeleton-${index}`} />
                  ))}
                </div>
              }
              errorFallback={
                <ErrorState message="Announcements could not be loaded right now. Please try again later." />
              }
              empty={
                <EmptyState
                  title="No announcements at the moment."
                  description="Official community notices will appear here when they are available."
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
                      : 'Official community notices will appear here when they are available.'
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
                <StaggerGridReveal className={ANNOUNCEMENT_GRID_CLASS}>
                  {visibleAnnouncements.map((item) => (
                    <RevealItem
                      key={item.id || item.slug || item.title}
                      className="min-w-0"
                    >
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
        ) : null}
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
