import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import {
  Button,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  StateGate,
} from '../../components/ui/index.jsx'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import { getPublicLeaderBySlug } from '../../api/endpoints.js'

function hasHtmlMarkup(value = '') {
  return /<[^>]+>/.test(String(value || ''))
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toRichTextHtml(value = '') {
  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  if (hasHtmlMarkup(text)) {
    return text
  }

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

function LeaderPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[24px] border border-dashed border-border/80 bg-background/70 px-6 text-center text-sm text-muted-foreground">
      Portrait image unavailable
    </div>
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

export default function LeaderProfile() {
  const { slug } = useParams()
  const [leader, setLeader] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadLeader = async () => {
      if (!slug) {
        if (isMounted) {
          setLeader(null)
          setError(new Error('Missing leadership profile identifier.'))
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await getPublicLeaderBySlug(slug)
        if (!isMounted) {
          return
        }
        setLeader(response?.data || response || null)
      } catch (err) {
        if (!isMounted) {
          return
        }

        if (err?.status === 404) {
          setLeader(null)
          setError(null)
        } else {
          setError(err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadLeader()

    return () => {
      isMounted = false
    }
  }, [slug])

  const name = leader?.name || 'Leadership profile'
  const roleTitle = leader?.role_title || ''
  const body = toRichTextHtml(leader?.full_bio || leader?.short_bio_snippet || '')
  const imageUrl = leader?.photo ? resolveAssetUrl(leader.photo) : ''

  return (
    <section className="bg-background py-8 sm:py-10 md:py-12">
      <StateGate
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !leader}
        skeleton={<DetailSkeleton />}
        errorFallback={
          <div className="container">
            <ErrorState
              message={error?.message || 'Unable to load this leadership profile.'}
            />
          </div>
        }
        empty={
          <div className="container">
            <EmptyState
              title="Profile not found"
              description="This leadership profile may have been removed."
              action={
                <Button as={Link} to="/about/leadership-governance" variant="ghost">
                  Back to Leadership & Governance
                </Button>
              }
            />
          </div>
        }
      >
        <article className="container mx-auto max-w-6xl space-y-4">
          <Link
            to="/about/leadership-governance"
            className="group inline-flex items-center gap-3 rounded-full border border-border/70 bg-surface/90 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-white hover:shadow-md"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
              <ArrowLeftIcon className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Go Back
              </span>
              <span>Leadership & Governance</span>
            </span>
          </Link>

          <div className="relative overflow-hidden rounded-[30px] border border-border/70 bg-surface shadow-[0_20px_52px_rgba(15,23,42,0.08)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-primary/10 via-transparent to-accent/70"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-10 bottom-10 h-32 w-32 rounded-full bg-accent/60 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(260px,360px),1fr] lg:items-start lg:gap-10 lg:p-10">
              <div className="space-y-4">
                <div className="rounded-[26px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,242,235,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:p-4">
                  <div className="aspect-[4/5] overflow-hidden rounded-[24px] border border-border/60 bg-white/80 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${name} portrait`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <LeaderPlaceholder />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <header className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm">
                      Leadership Profile
                    </span>
                    {roleTitle ? (
                      <span className="inline-flex items-center rounded-full border border-border/70 bg-accent/35 px-3 py-1.5 text-xs font-medium text-foreground/80">
                        {roleTitle}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h1 className="max-w-3xl break-words text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                      {name}
                    </h1>
                    {roleTitle ? (
                      <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                        {roleTitle}
                      </p>
                    ) : null}
                  </div>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/55 px-4 py-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Profile
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      Leadership & Governance
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/55 px-4 py-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Role
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {roleTitle || 'Leadership role'}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:p-6 lg:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      Biography
                    </h2>
                  </div>

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
