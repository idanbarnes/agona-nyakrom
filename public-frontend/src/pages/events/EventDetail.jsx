import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getPublicEventDetail,
  getPublicEvents,
} from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import { useDocumentTitle } from '../../lib/pageTitle.js'
import useCmsPreviewRefresh from '../../lib/useCmsPreviewRefresh.js'
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
  StateGate,
} from '../../components/ui/index.jsx'
import RevealItem from '../../components/motion/RevealItem.jsx'
import StaggerGridReveal from '../../components/motion/StaggerGridReveal.jsx'
import { buildIcsEvent, downloadIcs, hasCalendarDate } from '../../utils/calendar.js'
import ImageLightbox from '../../components/ImageLightbox.jsx'
import { downloadRemoteFile, openFileFallback } from '../../utils/download.js'
import { buildEventDetailPath } from '../announcementsEventsPaths.js'

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

function CalendarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5v3M16 3.5v3M3.5 9.5h17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ShareIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle
        cx="18"
        cy="5"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="6"
        cy="12"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="18"
        cy="19"
        r="2.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="m8.1 11 7.8-4.5m-7.8 6 7.8 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  )
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
        className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 bg-surface px-3.5 text-xs font-semibold text-foreground transition hover:border-[#7BC77D] hover:bg-[#EDF8EE] hover:text-[#1E6B31]"
      >
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 bg-surface px-3.5 text-xs font-semibold text-foreground transition hover:border-[#A9C8FF] hover:bg-[#EFF6FF] hover:text-[#2457B5]"
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 bg-surface px-3.5 text-xs font-semibold text-foreground transition hover:border-[#1F2937] hover:bg-[#111827] hover:text-white"
      >
        X
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 bg-surface px-3.5 text-xs font-semibold text-foreground transition hover:border-[#E7B76D] hover:bg-accent/60 hover:text-[#9A5600]"
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
      <div className="flex h-full w-full items-center justify-center rounded-[20px] border border-dashed border-border/80 bg-background/70 text-muted-foreground">
        <svg
          viewBox="0 0 24 24"
          width="38"
          height="38"
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
      className="h-full w-full rounded-[20px] object-contain"
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
  const [previewImage, setPreviewImage] = useState(null)
  const [flyerDownloading, setFlyerDownloading] = useState(false)

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

  useCmsPreviewRefresh(loadEvent)

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
  const showCalendar = state !== 'PAST' && hasCalendarDate(item?.event_date)
  const hasFlyer = Boolean(item?.flyer_image_path)
  const flyerUrl = hasFlyer ? resolveAssetUrl(item.flyer_image_path) : ''
  useDocumentTitle(item?.title || 'Event')
  const canonicalPath = useMemo(
    () => buildEventDetailPath(item?.slug || slug),
    [item?.slug, slug],
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !canonicalPath) {
      return
    }

    const nextShareUrl = new URL(canonicalPath, window.location.origin).toString()
    setShareUrl(nextShareUrl)

    if (window.location.pathname === canonicalPath) {
      return
    }

    const nextUrl = `${canonicalPath}${window.location.search}${window.location.hash}`
    window.history.replaceState(window.history.state, '', nextUrl)
  }, [canonicalPath])

  const sharePayload = useMemo(
    () => buildSharePayload(item, shareUrl),
    [item, shareUrl],
  )
  const eventUrl = useMemo(() => {
    if (shareUrl) {
      return shareUrl
    }

    if (typeof window !== 'undefined') {
      const slugValue = item?.slug || slug
      if (slugValue) {
        return new URL(buildEventDetailPath(slugValue), window.location.origin).toString()
      }
    }

    return ''
  }, [item?.slug, shareUrl, slug])

  const handleCalendar = () => {
    if (!showCalendar) {
      return
    }

    const ics = buildIcsEvent({
      title: item?.title || 'Community Event',
      description: item?.excerpt || item?.body || '',
      date: item?.event_date,
      uid: `${item?.slug || item?.id || 'event'}@agona-nyakrom`,
      url: eventUrl,
      isAllDay: true,
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

  const handleFlyerDownload = useCallback(async () => {
    if (!flyerUrl || flyerDownloading) {
      return
    }

    setFlyerDownloading(true)

    try {
      await downloadRemoteFile({
        url: flyerUrl,
        filename: item?.slug ? `event-${item.slug}` : item?.title || 'event-flyer',
        fallbackBaseName: 'event-flyer',
      })
    } catch {
      openFileFallback(flyerUrl)
    } finally {
      setFlyerDownloading(false)
    }
  }, [flyerDownloading, flyerUrl, item?.slug, item?.title])

  const handlePreviewImage = useCallback(
    (src, alt, caption) => {
      if (!src) {
        return
      }

      setPreviewImage({ src, alt, caption })
    },
    [],
  )

  const content = item?.body || item?.excerpt || ''
  const stateLabel =
    state === 'PAST' ? 'Past' : state === 'UPCOMING' ? 'Upcoming' : 'Coming Soon'

  return (
    <section className="container py-6 md:py-10">
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
        <div className="mx-auto max-w-6xl space-y-8">
          <Link
            to="/announcements-events"
            className="inline-flex items-center rounded-full border border-transparent px-1 text-sm font-medium text-muted-foreground transition hover:border-border/60 hover:bg-surface hover:px-3 hover:text-foreground"
          >
            {backArrow} Back to Announcements & Events
          </Link>

          <article className="relative overflow-hidden rounded-[28px] border border-border/70 bg-surface shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-primary/10 via-transparent to-accent/70"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-12 bottom-8 h-32 w-32 rounded-full bg-accent/70 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative grid gap-8 p-5 sm:p-7 lg:p-8 xl:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)] xl:items-start xl:gap-10 xl:p-10">
              <div className="order-2 space-y-6 xl:order-1">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {item?.event_tag ? (
                      <Badge
                        variant="muted"
                        className="px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em]"
                      >
                        {item.event_tag}
                      </Badge>
                    ) : null}
                    <Badge
                      variant={
                        state === 'PAST'
                          ? 'muted'
                          : state === 'UPCOMING'
                            ? 'success'
                            : 'warning'
                      }
                      className="px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em]"
                    >
                      {stateLabel}
                    </Badge>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>
                        {state === 'COMING_SOON'
                          ? 'Date: To be announced'
                          : `Date: ${dateLabel}`}
                      </span>
                    </span>
                  </div>

                  <h1 className="max-w-3xl break-words text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                    {item?.title || 'Event detail'}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  {showCalendar ? (
                    <Button
                      variant="secondary"
                      className="rounded-xl border border-border/70 bg-background/80 px-5"
                      onClick={handleCalendar}
                    >
                      Add to Calendar
                    </Button>
                  ) : null}
                  {hasFlyer ? (
                    <>
                      <Button
                        variant="secondary"
                        className="rounded-xl border border-border/70 bg-background/80 px-5"
                        onClick={handleFlyerDownload}
                        loading={flyerDownloading}
                        disabled={flyerDownloading}
                      >
                        Download Flyer
                      </Button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label={`Share ${item?.title || 'this event'}`}
                    aria-expanded={shareOpen}
                    aria-haspopup="menu"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/70 px-5 text-sm font-medium text-foreground transition-[color,background-color,border-color,transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-[1px] hover:bg-background active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <ShareIcon className="h-[18px] w-[18px] shrink-0" />
                    <span className="whitespace-nowrap">Share</span>
                  </button>
                </div>

                {shareOpen ? (
                  <div className="rounded-[22px] border border-border/70 bg-background/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur">
                    <ShareMenu
                      url={shareUrl}
                      title={sharePayload.title}
                      text={sharePayload.text}
                    />
                  </div>
                ) : null}
              </div>

              <div className="order-1 xl:order-2">
                <div className="rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,245,239,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:p-4">
                  <button
                    type="button"
                    onClick={() =>
                      handlePreviewImage(
                        flyerUrl,
                        item?.flyer_alt_text || `${item?.title || 'Event'} flyer`,
                        item?.title || 'Event flyer',
                      )
                    }
                    aria-label={`View image for ${item?.title || 'this event'}`}
                    className="block w-full cursor-zoom-in rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="aspect-[16/11] overflow-hidden rounded-[20px] border border-border/60 bg-white/80 shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:aspect-[4/3] xl:aspect-[4/5]">
                      <EventImage event={item} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr),320px]">
            <Card className="overflow-hidden rounded-[24px] border border-border/70 bg-surface shadow-[0_14px_36px_rgba(15,23,42,0.07)]">
              <CardContent className="space-y-5 p-5 sm:p-7 lg:p-8">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  About this event
                </h2>
                {content ? (
                  <div className="whitespace-pre-line text-[1.02rem] leading-8 text-foreground/90">
                    {content}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-muted-foreground">
                    No additional information provided yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="overflow-hidden rounded-[24px] border border-border/70 bg-surface shadow-[0_14px_36px_rgba(15,23,42,0.07)]">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Event Info
                  </h2>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-medium text-muted-foreground">
                          Status
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {stateLabel}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-medium text-muted-foreground">
                          Date
                        </span>
                        <span className="text-right text-sm font-semibold text-foreground">
                          {state === 'COMING_SOON' ? 'To be announced' : dateLabel}
                        </span>
                      </div>
                    </div>
                    {item?.event_tag ? (
                      <div className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm font-medium text-muted-foreground">
                            Tag
                          </span>
                          <span className="text-right text-sm font-semibold text-foreground">
                            {item.event_tag}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label={`Share ${item?.title || 'this event'}`}
                    aria-expanded={shareOpen}
                    aria-haspopup="menu"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 text-sm font-medium text-foreground transition-[color,background-color,border-color,transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-[1px] hover:bg-background active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <ShareIcon className="h-[18px] w-[18px] shrink-0" />
                    <span className="whitespace-nowrap">Share</span>
                  </button>
                </CardContent>
              </Card>

              {state === 'PAST' ? (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-6 text-foreground/80">
                  This event has already taken place. Date shown for reference.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              More Events
            </h2>
            {related.length ? (
              <StaggerGridReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((event) => (
                  <RevealItem key={event.slug || event.id}>
                    <Card className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-border/70 bg-surface shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                      <div className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(245,239,230,0.7),rgba(255,255,255,0.9))] p-3">
                        <div className="aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-border/60 bg-white/80">
                          {event.flyer_image_path ? (
                            <button
                              type="button"
                              onClick={() =>
                                handlePreviewImage(
                                  resolveAssetUrl(event.flyer_image_path),
                                  event.flyer_alt_text ||
                                    `${event.title || 'Event'} flyer`,
                                  event.title || 'Event flyer',
                                )
                              }
                              aria-label={`View image for ${event.title || 'this event'}`}
                              className="h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              <ImageWithFallback
                                src={resolveAssetUrl(event.flyer_image_path)}
                                alt={
                                  event.flyer_alt_text || `${event.title || 'Event'} flyer`
                                }
                                className="h-full w-full transform-gpu object-contain p-3 transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                                fallbackText={event.title || 'Event'}
                              />
                            </button>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-background/70 text-muted-foreground">
                              <svg
                                viewBox="0 0 24 24"
                                width="26"
                                height="26"
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
                      </div>
                      <CardContent className="flex flex-1 flex-col space-y-3 p-5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-[#B45309]">
                            {event.title || 'Event'}
                          </h3>
                          {event.event_tag ? (
                            <Badge variant="muted">{event.event_tag}</Badge>
                          ) : null}
                        </div>
                        {normalizeEventState(event) === 'COMING_SOON' ? (
                          <p className="text-sm text-muted-foreground">
                            Date: To be announced
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.event_date)}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="justify-start px-5 pb-5 pt-0">
                        <DetailPageCTA
                          to={buildEventDetailPath(event.slug)}
                          label="View Details"
                        />
                      </CardFooter>
                    </Card>
                  </RevealItem>
                ))}
              </StaggerGridReveal>
            ) : (
              <p className="text-sm text-muted-foreground">
                No related events available.
              </p>
            )}
          </div>
        </div>
      </StateGate>

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

export default EventDetail
