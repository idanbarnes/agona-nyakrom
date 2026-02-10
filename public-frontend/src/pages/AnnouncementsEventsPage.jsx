import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAnnouncementsEvents,
  getPublicAnnouncements,
  getPublicEvents,
} from '../api/endpoints.js'
import { resolveAssetUrl } from '../lib/apiBase.js'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardSkeleton,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  StateGate,
} from '../components/ui/index.jsx'
import { buildIcsEvent, downloadIcs } from '../utils/calendar.js'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'coming_soon', label: 'Coming Soon' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
]

const DEFAULT_PAST_LIMIT = 6

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
      className="h-full w-full rounded-t-lg object-cover"
      fallbackText={title}
    />
  )
}

function EventCard({ event, variant = 'compact', showCalendar }) {
  const slug = getEventSlug(event)
  const dateLabel = formatDate(event?.event_date)
  const hasFlyer = Boolean(event?.flyer_image_path)

  const handleCalendar = () => {
    const ics = buildIcsEvent({
      title: event?.title || 'Community Event',
      description: event?.excerpt || event?.body || '',
      date: event?.event_date || null,
      uid: `${slug}@agona-nyakrom`,
      isAllDay: true,
      isComingSoon: !event?.event_date,
    })

    downloadIcs({ filename: `event-${slug}.ics`, content: ics })
  }

  const contentStyle = {
    display: '-webkit-box',
    WebkitLineClamp: variant === 'compact' ? 2 : 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="aspect-[16/9] w-full">
        <EventImage event={event} />
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
        {showCalendar ? (
          <Button variant="secondary" size="sm" onClick={handleCalendar}>
            Add to Calendar
          </Button>
        ) : null}
        {hasFlyer ? (
          <a
            href={resolveAssetUrl(event.flyer_image_path)}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80"
          >
            Download Flyer
          </a>
        ) : null}
        <Button variant="ghost" size="sm" as={Link} to={`/events/${slug}`}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}

function AnnouncementCard({ item }) {
  const hasFlyer = Boolean(item?.flyer_image_path)
  const dateLabel = formatDate(item?.created_at || item?.published_at)
  const slug = item?.slug || item?.id || 'announcement'

  const contentStyle = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {hasFlyer ? (
        <ImageWithFallback
          src={resolveAssetUrl(item.flyer_image_path)}
          alt={item?.flyer_alt_text || `${item?.title || 'Announcement'} flyer`}
          className="h-40 w-full object-cover"
          fallbackText={item?.title || 'Announcement'}
        />
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
        <Button
          variant="ghost"
          size="sm"
          as={Link}
          to={`/announcements/${slug}`}
        >
          View Details
        </Button>
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
  const [showAllPast, setShowAllPast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      } catch (err) {
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

  const visibleComingSoon =
    activeTab === 'all' || activeTab === 'coming_soon'
      ? events.comingSoon
      : []
  const visibleUpcoming =
    activeTab === 'all' || activeTab === 'upcoming' ? events.upcoming : []
  const visiblePast =
    activeTab === 'all' || activeTab === 'past' ? events.past : []

  const pastVisibleItems = showAllPast
    ? visiblePast
    : visiblePast.slice(0, DEFAULT_PAST_LIMIT)

  return (
    <section className="container py-8 md:py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground break-words md:text-3xl">
          Announcements & Events
        </h1>
        <p className="text-sm text-muted-foreground">
          Stay up to date on community announcements and upcoming events.
        </p>
      </div>

      <div className="mt-8 space-y-12">
        <section className="space-y-6">
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
            <div className="space-y-10">
              {visibleComingSoon.length ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Coming Soon
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {visibleComingSoon.map((event) => (
                      <EventCard
                        key={event.id || event.slug || event.title}
                        event={event}
                        variant="compact"
                        showCalendar
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {visibleUpcoming.length ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Upcoming</h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {visibleUpcoming.map((event) => (
                      <EventCard
                        key={event.id || event.slug || event.title}
                        event={event}
                        variant="large"
                        showCalendar
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {visiblePast.length ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Past Events
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {pastVisibleItems.map((event) => (
                      <EventCard
                        key={event.id || event.slug || event.title}
                        event={event}
                        variant="compact"
                        showCalendar={false}
                      />
                    ))}
                  </div>
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {announcements.map((item) => (
                <AnnouncementCard
                  key={item.id || item.slug || item.title}
                  item={item}
                />
              ))}
            </div>
          </StateGate>
        </section>
      </div>
    </section>
  )
}

export default AnnouncementsEventsPage
