import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getPublicAnnouncementDetail,
  getPublicAnnouncements,
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
import ImageLightbox from '../../components/ImageLightbox.jsx'
import { downloadRemoteFile, openFileFallback } from '../../utils/download.js'
import { buildAnnouncementDetailPath } from '../announcementsEventsPaths.js'

const MORE_COUNT = 5

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

function ArrowLeftIcon({ className = 'h-4 w-4' }) {
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
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

// Simple announcement icon for no-flyer states.
function AnnouncementIcon() {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-background/70">
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
  const [previewImage, setPreviewImage] = useState(null)
  const [flyerDownloading, setFlyerDownloading] = useState(false)

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

  useCmsPreviewRefresh(loadAnnouncement)

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
  useDocumentTitle(item?.title || 'Announcement')
  const canonicalPath = useMemo(
    () => buildAnnouncementDetailPath(item?.slug || slug),
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
        filename: item?.slug
          ? `announcement-${item.slug}`
          : item?.title || 'announcement-flyer',
        fallbackBaseName: 'announcement-flyer',
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

  return (
    <section className="container py-6 md:py-10">
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
                  Back to Announcements & Events
                </Button>
              }
            />
        }
      >
        <div className="mx-auto max-w-6xl space-y-8">
          <Link
            to="/announcements-events"
            className="group inline-flex items-center gap-3 rounded-full border border-border/70 bg-surface/90 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-white hover:shadow-md"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
              <ArrowLeftIcon className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Go Back
              </span>
              <span>Announcements & Events</span>
            </span>
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

            <div
              className={`relative grid gap-8 p-5 sm:p-7 lg:p-8 xl:gap-10 xl:p-10 ${
                hasFlyer
                  ? 'xl:grid-cols-[minmax(0,1.05fr),minmax(320px,0.95fr)] xl:items-start'
                  : ''
              }`}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge
                      variant="muted"
                      className="px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em]"
                    >
                      Official Announcement
                    </Badge>
                    {dateLabel ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>Published {dateLabel}</span>
                      </span>
                    ) : null}
                    {!hasFlyer ? <AnnouncementIcon /> : null}
                  </div>

                  <h1 className="max-w-3xl break-words text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                    {item?.title || 'Announcement detail'}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
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
                    aria-label={`Share ${item?.title || 'this announcement'}`}
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

              {hasFlyer ? (
                <div>
                  <div className="rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,245,239,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:p-4">
                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewImage(
                          flyerUrl,
                          item?.flyer_alt_text ||
                            `${item?.title || 'Announcement'} flyer`,
                          item?.title || 'Announcement flyer',
                        )
                      }
                      aria-label={`View image for ${item?.title || 'this announcement'}`}
                      className="block w-full cursor-zoom-in rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="aspect-[16/11] overflow-hidden rounded-[20px] border border-border/60 bg-white/80 shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:aspect-[4/3] xl:aspect-[4/5]">
                        <ImageWithFallback
                          src={flyerUrl}
                          alt={
                            item?.flyer_alt_text ||
                            `${item?.title || 'Announcement'} flyer`
                          }
                          className="h-full w-full object-contain"
                          fallbackText={item?.title || 'Announcement'}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr),320px]">
            <Card className="overflow-hidden rounded-[24px] border border-border/70 bg-surface shadow-[0_14px_36px_rgba(15,23,42,0.07)]">
              <CardContent className="p-5 sm:p-7 lg:p-8">
                <div className="whitespace-pre-line text-[1.02rem] leading-8 text-foreground/90">
                  {item?.body || 'No additional details provided.'}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[24px] border border-border/70 bg-surface shadow-[0_14px_36px_rgba(15,23,42,0.07)]">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Published
                    </span>
                    <span className="text-right text-sm font-semibold text-foreground">
                      {dateLabel || 'Recently'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={`Share ${item?.title || 'this announcement'}`}
                  aria-expanded={shareOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 text-sm font-medium text-foreground transition-[color,background-color,border-color,transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-[1px] hover:bg-background active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ShareIcon className="h-[18px] w-[18px] shrink-0" />
                  <span className="whitespace-nowrap">Share</span>
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                More Announcements
              </h2>
              <Button as={Link} to="/announcements-events" variant="ghost" size="sm">
                View all
              </Button>
            </div>
            {moreItems.length ? (
              <StaggerGridReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {moreItems.map((announcement) => (
                  <RevealItem key={announcement.slug || announcement.id}>
                    <Card className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-border/70 bg-surface shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                      <div className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(245,239,230,0.7),rgba(255,255,255,0.9))] p-3">
                        {announcement.flyer_image_path ? (
                          <div className="overflow-hidden rounded-[18px] border border-border/60 bg-white/80">
                            <button
                              type="button"
                              onClick={() =>
                                handlePreviewImage(
                                  resolveAssetUrl(announcement.flyer_image_path),
                                  announcement.flyer_alt_text ||
                                    `${announcement.title || 'Announcement'} flyer`,
                                  announcement.title || 'Announcement flyer',
                                )
                              }
                              aria-label={`View image for ${announcement.title || 'this announcement'}`}
                              className="h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              <ImageWithFallback
                                src={resolveAssetUrl(announcement.flyer_image_path)}
                                alt={
                                  announcement.flyer_alt_text ||
                                  `${announcement.title || 'Announcement'} flyer`
                                }
                                className="h-44 w-full transform-gpu object-contain p-3 transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                                fallbackText={announcement.title || 'Announcement'}
                              />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-44 w-full items-center justify-center rounded-[18px] border border-border/60 bg-background/70 text-muted-foreground">
                            <AnnouncementIcon />
                          </div>
                        )}
                      </div>
                      <CardContent className="flex flex-1 flex-col space-y-3 p-5">
                        <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-[#B45309]">
                          {announcement.title || 'Announcement'}
                        </h3>
                        {announcement.excerpt ? (
                          <p
                            className="text-sm leading-6 text-muted-foreground"
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
                        <p className="text-sm text-muted-foreground">
                          {formatDate(
                            announcement.published_at || announcement.created_at,
                          )}
                        </p>
                      </CardContent>
                      <CardFooter className="justify-start px-5 pb-5 pt-0">
                        <DetailPageCTA
                          to={buildAnnouncementDetailPath(announcement.slug)}
                          label="View Details"
                        />
                      </CardFooter>
                    </Card>
                  </RevealItem>
                ))}
              </StaggerGridReveal>
            ) : (
              <p className="text-sm text-muted-foreground">
                No additional announcements available.
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

export default AnnouncementDetail
