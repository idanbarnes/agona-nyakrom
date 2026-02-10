import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getPublicEventDetail,
  getPublicEvents,
} from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
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
} from '../../components/ui/index.jsx'
import { buildIcsEvent, downloadIcs } from '../../utils/calendar.js'
import ImageLightbox from '../../components/ImageLightbox.jsx'

const RELATED_COUNT = 3
const backArrow = String.fromCharCode(8592)

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

// Build a share payload with a short description snippet.
function buildSharePayload(item, url) {
  const description = item?.excerpt || item?.body || ''
  const snippet = description.slice(0, 160)
  return {
    title: item?.title || 'Event details',
    text: snippet,
    url,
  }
}

// Fallback share menu for browsers without navigator.share.
function ShareMenu({ url, title, text }) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text || title)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80"
      >
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80"
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80"
      >
        X
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}

// Hero image with a simple fallback banner.
function EventImage({ event }) {
  const flyer = event?.flyer_image_path
  const title = event?.title || 'Event flyer'

  if (!flyer) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
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
      className="h-full w-full rounded-xl object-cover"
      fallbackText={title}
    />
  )
}

function EventDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareUrl, setShareUrl] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  const loadEvent = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing event slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getPublicEventDetail(slug)
      const payload = response?.data || response
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
    loadEvent()
  }, [loadEvent])

  useEffect(() => {
    if (!item?.slug && !item?.id) return

    let isMounted = true

    const loadRelated = async () => {
      try {
        const response = await getPublicEvents({ state: 'all', limit: 30 })
        if (!isMounted) return

        const payload = response?.data || response
        const items = Array.isArray(payload)
          ? payload
          : payload?.items || payload?.events || []

        const filtered = items.filter(
          (event) => event?.slug && event.slug !== item.slug,
        )

        const ranked = filtered.sort((a, b) => {
          const order = { UPCOMING: 0, COMING_SOON: 1, PAST: 2 }
          const stateA = normalizeEventState(a)
          const stateB = normalizeEventState(b)
          if (order[stateA] !== order[stateB]) {
            return order[stateA] - order[stateB]
          }
          return 0
        })

        setRelated(ranked.slice(0, RELATED_COUNT))
      } catch {
        if (isMounted) {
          setRelated([])
        }
      }
    }

    loadRelated()

    return () => {
      isMounted = false
    }
  }, [item])

  const state = normalizeEventState(item)
  const dateLabel = formatDate(item?.event_date)
  const showCalendar = state !== 'PAST'
  const hasFlyer = Boolean(item?.flyer_image_path)
  const flyerUrl = hasFlyer ? resolveAssetUrl(item.flyer_image_path) : ''
  const sharePayload = useMemo(
    () => buildSharePayload(item, shareUrl),
    [item, shareUrl],
  )

  const handleCalendar = () => {
    const ics = buildIcsEvent({
      title: item?.title || 'Community Event',
      description: item?.excerpt || item?.body || '',
      date: item?.event_date || null,
      uid: `${item?.slug || item?.id || 'event'}@agona-nyakrom`,
      isAllDay: true,
      isComingSoon: !item?.event_date,
    })

    downloadIcs({ filename: `event-${item?.slug || 'event'}.ics`, content: ics })
  }

  const handleShare = async () => {
    if (!shareUrl) return

    if (navigator.share) {
      try {
        await navigator.share(sharePayload)
        return
      } catch {
        setShareOpen(true)
        return
      }
    }

    setShareOpen((current) => !current)
  }

  const content = item?.body || item?.excerpt || ''

  return (
    <section className="container py-8 md:py-12">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<CardSkeleton />}
        errorFallback={
          <ErrorState message={error?.message || 'Unable to load this event.'} />
        }
        empty={
          <EmptyState
            title="Not found"
            description="This event may have been removed."
            action={
              <Button as={Link} to="/announcements-events" variant="ghost">
                {backArrow} Back to Announcements & Events
              </Button>
            }
          />
        }
      >
        <div className="space-y-8">
          <Link
            to="/announcements-events"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {backArrow} Back to Announcements & Events
          </Link>

          <div className="space-y-6">
            <div className="aspect-[16/9] w-full">
              <EventImage event={item} />
            </div>
            <div className="space-y-4">
              {item?.event_tag ? (
                <Badge variant="muted">{item.event_tag}</Badge>
              ) : null}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-foreground break-words md:text-4xl">
                    {item?.title || 'Event detail'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        state === 'PAST'
                          ? 'muted'
                          : state === 'UPCOMING'
                            ? 'success'
                            : 'warning'
                      }
                    >
                      {state === 'PAST'
                        ? 'Past'
                        : state === 'UPCOMING'
                          ? 'Upcoming'
                          : 'Coming Soon'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {state === 'COMING_SOON'
                        ? 'Date: To be announced'
                        : `Date: ${dateLabel}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {showCalendar ? (
                    <Button variant="secondary" onClick={handleCalendar}>
                      Add to Calendar
                    </Button>
                  ) : null}
                  {hasFlyer ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setLightboxOpen(true)}
                      >
                        View Image
                      </Button>
                      <a
                        href={flyerUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
                      >
                        Download Flyer
                      </a>
                    </>
                  ) : null}
                  <Button variant="ghost" onClick={handleShare}>
                    Share
                  </Button>
                </div>
              </div>
              {shareOpen ? (
                <ShareMenu
                  url={shareUrl}
                  title={sharePayload.title}
                  text={sharePayload.text}
                />
              ) : null}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                About this event
              </h2>
              {content ? (
                <div className="leading-7 text-foreground whitespace-pre-line">
                  {content}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No additional information provided yet.
                </p>
              )}
            </div>
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Event Info</h2>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Status:</span>{' '}
                      {state === 'PAST'
                        ? 'Past'
                        : state === 'UPCOMING'
                          ? 'Upcoming'
                          : 'Coming Soon'}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Date:</span>{' '}
                      {state === 'COMING_SOON'
                        ? 'To be announced'
                        : dateLabel}
                    </div>
                    {item?.event_tag ? (
                      <div>
                        <span className="font-medium text-foreground">Tag:</span>{' '}
                        {item.event_tag}
                      </div>
                    ) : null}
                  </div>
                  <Button variant="secondary" onClick={handleShare}>
                    Share
                  </Button>
                </CardContent>
              </Card>
              {state === 'PAST' ? (
                <p className="text-sm text-muted-foreground">
                  This event has already taken place. Date shown for reference.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">More Events</h2>
            {related.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((event) => (
                  <Card key={event.slug || event.id} className="overflow-hidden">
                    <div className="aspect-[16/9] w-full">
                      {event.flyer_image_path ? (
                        <ImageWithFallback
                          src={resolveAssetUrl(event.flyer_image_path)}
                          alt={
                            event.flyer_alt_text || `${event.title || 'Event'} flyer`
                          }
                          className="h-full w-full object-cover"
                          fallbackText={event.title || 'Event'}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                          <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            aria-hidden="true"
                            className="text-muted-foreground"
                          >
                            <path
                              d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2v10h16V7H4Zm2 2h5v3H6V9Zm0 4h9v2H6v-2Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {event.title || 'Event'}
                        </h3>
                        {event.event_tag ? (
                          <Badge variant="muted">{event.event_tag}</Badge>
                        ) : null}
                      </div>
                      {normalizeEventState(event) === 'COMING_SOON' ? (
                        <p className="text-xs text-muted-foreground">
                          Date: To be announced
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.event_date)}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        as={Link}
                        to={`/events/${event.slug}`}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No related events available.
              </p>
            )}
          </div>
        </div>
      </StateGate>

      {hasFlyer ? (
        <ImageLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          src={flyerUrl}
          alt={item?.flyer_alt_text || `${item?.title || 'Event'} flyer`}
        />
      ) : null}
    </section>
  )
}

export default EventDetail




