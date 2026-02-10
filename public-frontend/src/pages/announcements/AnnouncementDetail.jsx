import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getPublicAnnouncementDetail,
  getPublicAnnouncements,
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
import ImageLightbox from '../../components/ImageLightbox.jsx'

const MORE_COUNT = 5
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Build a share payload with a short description snippet.
function buildSharePayload(item, url) {
  const description = item?.excerpt || item?.body || ''
  const snippet = description.slice(0, 160)
  return {
    title: item?.title || 'Announcement details',
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

// Simple announcement icon for no-flyer states.
function AnnouncementIcon() {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
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
  )
}

function AnnouncementDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [moreItems, setMoreItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareUrl, setShareUrl] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  const loadAnnouncement = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing announcement slug.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getPublicAnnouncementDetail(slug)
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
    loadAnnouncement()
  }, [loadAnnouncement])

  useEffect(() => {
    if (!item?.slug) return

    let isMounted = true

    const loadMore = async () => {
      try {
        const response = await getPublicAnnouncements({ limit: 10 })
        if (!isMounted) return

        const payload = response?.data || response
        const items = Array.isArray(payload)
          ? payload
          : payload?.items || payload?.announcements || []

        const filtered = items.filter(
          (announcement) => announcement?.slug && announcement.slug !== item.slug,
        )

        setMoreItems(filtered.slice(0, MORE_COUNT))
      } catch {
        if (isMounted) {
          setMoreItems([])
        }
      }
    }

    loadMore()

    return () => {
      isMounted = false
    }
  }, [item])

  const publishedAt = item?.published_at || item?.created_at
  const dateLabel = useMemo(() => formatDate(publishedAt), [publishedAt])
  const hasFlyer = Boolean(item?.flyer_image_path)
  const flyerUrl = hasFlyer ? resolveAssetUrl(item.flyer_image_path) : ''
  const sharePayload = useMemo(
    () => buildSharePayload(item, shareUrl),
    [item, shareUrl],
  )

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

  return (
    <section className="container py-8 md:py-12">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<CardSkeleton />}
        errorFallback={
          <ErrorState
            message={error?.message || 'Unable to load this announcement.'}
          />
        }
        empty={
          <EmptyState
            title="Not found"
            description="This announcement may have been removed."
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

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground break-words md:text-4xl">
                {item?.title || 'Announcement detail'}
              </h1>
              <Badge variant="muted">Official Announcement</Badge>
              {!hasFlyer ? <AnnouncementIcon /> : null}
            </div>
            <div className="flex flex-wrap gap-2">
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
            {shareOpen ? (
              <ShareMenu
                url={shareUrl}
                title={sharePayload.title}
                text={sharePayload.text}
              />
            ) : null}
            {hasFlyer ? (
              <div className="aspect-[16/9] w-full">
                <ImageWithFallback
                  src={flyerUrl}
                  alt={
                    item?.flyer_alt_text || `${item?.title || 'Announcement'} flyer`
                  }
                  className="h-full w-full rounded-xl object-cover"
                  fallbackText={item?.title || 'Announcement'}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="leading-7 text-foreground whitespace-pre-line">
              {item?.body || 'No additional details provided.'}
            </div>
          </div>

          <Card className="bg-surface">
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Published {dateLabel || 'Recently'}
              </div>
              <Button variant="secondary" onClick={handleShare}>
                Share
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                More Announcements
              </h2>
              <Button as={Link} to="/announcements-events" variant="ghost" size="sm">
                View all
              </Button>
            </div>
            {moreItems.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {moreItems.map((announcement) => (
                  <Card key={announcement.slug || announcement.id} className="overflow-hidden">
                    {announcement.flyer_image_path ? (
                      <ImageWithFallback
                        src={resolveAssetUrl(announcement.flyer_image_path)}
                        alt={
                          announcement.flyer_alt_text ||
                          `${announcement.title || 'Announcement'} flyer`
                        }
                        className="h-40 w-full object-cover"
                        fallbackText={announcement.title || 'Announcement'}
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-muted text-muted-foreground">
                        <AnnouncementIcon />
                      </div>
                    )}
                    <CardContent className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {announcement.title || 'Announcement'}
                      </h3>
                      {announcement.excerpt ? (
                        <p
                          className="text-sm text-muted-foreground"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {announcement.excerpt}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(
                          announcement.published_at || announcement.created_at,
                        )}
                      </p>
                    </CardContent>
                    <CardFooter className="justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        as={Link}
                        to={`/announcements/${announcement.slug}`}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No additional announcements available.
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
          alt={item?.flyer_alt_text || `${item?.title || 'Announcement'} flyer`}
        />
      ) : null}
    </section>
  )
}

export default AnnouncementDetail


