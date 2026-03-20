import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHallOfFameDetail } from '../../api/endpoints.js'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import {
  Button,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import { useDocumentTitle } from '../../lib/pageTitle.js'
import useCmsPreviewRefresh from '../../lib/useCmsPreviewRefresh.js'
import { buildHallOfFameDetailPath } from './paths.js'

function Share2Icon({ className = 'h-5 w-5' }) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.7 10.7 15.3 7.3" />
      <path d="m8.7 13.3 6.6 3.4" />
    </svg>
  )
}

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function HallOfFameDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareMessage, setShareMessage] = useState('')

  const loadEntry = useCallback(async () => {
    if (!slug) {
      setItem(null)
      setLoading(false)
      setError(new Error('Missing hall of fame identifier.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await getHallOfFameDetail(slug)
      const payload = response?.data || response?.item || response
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
    loadEntry()
  }, [loadEntry])

  useCmsPreviewRefresh(loadEntry)

  const name = item?.name || item?.full_name || 'Hall of Fame'
  useDocumentTitle(name)
  const role = item?.title || item?.position || item?.role || ''
  const body = item?.body || item?.bio || item?.description || item?.content || ''
  const sharePath = useMemo(() => buildHallOfFameDetailPath(slug), [slug])

  const imagePath =
    item?.imageUrl ||
    item?.images?.large ||
    item?.images?.medium ||
    item?.images?.original ||
    item?.image ||
    item?.photo

  const imageUrl = useMemo(() => (imagePath ? resolveAssetUrl(imagePath) : ''), [imagePath])

  useEffect(() => {
    if (typeof window === 'undefined' || !slug || window.location.pathname === sharePath) {
      return
    }

    const nextUrl = `${sharePath}${window.location.search}${window.location.hash}`
    window.history.replaceState(window.history.state, '', nextUrl)
  }, [sharePath, slug])

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return
    }

    const shareUrl = new URL(sharePath, window.location.origin).toString()
    const sharePayload = {
      title: name,
      text: `Share the profile of ${name}`,
      url: shareUrl,
    }

    try {
      if (navigator?.share) {
        await navigator.share(sharePayload)
        setShareMessage('Shared successfully.')
      } else {
        await copyToClipboard(shareUrl)
        setShareMessage('Link copied to clipboard.')
      }
    } catch {
      try {
        await copyToClipboard(shareUrl)
        setShareMessage('Link copied to clipboard.')
      } catch {
        setShareMessage('Unable to share right now.')
      }
    }

    window.setTimeout(() => setShareMessage(''), 2000)
  }

  return (
    <section className="bg-background py-8 sm:py-10 md:py-12">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !item}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <div className="container">
            <ErrorState
              message={error?.message || 'Unable to load this entry.'}
              onRetry={loadEntry}
            />
          </div>
        }
        empty={
          <div className="container">
            <EmptyState
              title="Not found"
              description="This Hall of Fame entry may have been removed."
              action={
                <Button as={Link} to="/hall-of-fame" variant="ghost">
                  Back to hall of fame
                </Button>
              }
            />
          </div>
        }
      >
        <article className="container mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-7 lg:p-9">
            <div className="grid gap-6 md:grid-cols-[minmax(220px,300px),1fr] md:items-start lg:gap-10">
              <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/40">
                <div className="aspect-[4/5]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${name} portrait`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      Portrait image unavailable
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <header className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
                        {name}
                      </h1>
                      {role ? (
                        <p className="text-base text-muted-foreground md:text-lg">{role}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <Button
                        variant="ghost"
                        className="h-12 rounded-xl border border-[#d7d7d7] bg-white px-5 text-[1.0625rem] font-semibold text-[#111111] shadow-none hover:translate-y-0 hover:bg-[#fafafa] active:translate-y-0 active:scale-100 [&>span]:gap-0 [&>span>span:first-child]:hidden [&>span>span:last-child]:inline-flex [&>span>span:last-child]:items-center [&>span>span:last-child]:gap-2"
                        aria-label="Share profile"
                        onClick={handleShare}
                      >
                        <Share2Icon className="h-[18px] w-[18px] text-[#111111]" />
                        <span>Share Profile</span>
                      </Button>
                      <p
                        className="min-h-5 text-sm text-neutral-600 sm:text-right"
                        aria-live="polite"
                      >
                        {shareMessage}
                      </p>
                    </div>
                  </div>
                </header>

                <div className="min-w-0">
                  {body ? (
                    <RichTextRenderer html={body} />
                  ) : (
                    <p className="text-muted-foreground">No biography available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </StateGate>
    </section>
  )
}

export default HallOfFameDetail
