import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import { EmptyState, ErrorState, RichContentPageSkeleton } from '../../components/ui/index.jsx'
import { getAboutPageBySlug } from '../../api/endpoints.js'
import {
  ABOUT_PAGE_TITLES,
  ABOUT_SECTION_LABEL,
  PUBLIC_UI_LABELS,
} from '../../constants/publicChrome.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

const DEFAULT_SHARE_IMAGE = '/share-default.svg'

const extractFirstImageSrc = (html = '') => {
  const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] || ''
}

const setMeta = (selector, value, attr = 'content') => {
  let node = document.querySelector(selector)
  if (!node) {
    node = document.createElement('meta')
    if (selector.includes('property="')) {
      node.setAttribute('property', selector.split('property="')[1]?.split('"')[0] || '')
    } else {
      node.setAttribute('name', selector.split('name="')[1]?.split('"')[0] || '')
    }
    document.head.appendChild(node)
  }
  node.setAttribute(attr, value)
}

export default function AboutRichPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    if (!ABOUT_PAGE_TITLES[slug]) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setPage(null)
          setLoading(false)
        }
      })
      return () => {
        cancelled = true
      }
    }

    getAboutPageBySlug(slug)
      .then((res) => {
        if (!cancelled) {
          setPage(res.data || res)
          setLoading(false)
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setPage(null)
          setError(fetchError)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const pageTitle = useMemo(
    () => page?.page_title || ABOUT_PAGE_TITLES[slug] || ABOUT_SECTION_LABEL,
    [page, slug],
  )

  useEffect(() => {
    const seoTitle = page?.seo_meta_title || pageTitle
    const seoDescription = page?.seo_meta_description || ''
    const fallbackBodyImage = extractFirstImageSrc(page?.body || '')
    const shareImage = resolveAssetUrl(page?.seo_share_image || fallbackBodyImage || DEFAULT_SHARE_IMAGE)

    document.title = seoTitle
    setMeta('meta[name="description"]', seoDescription)
    setMeta('meta[property="og:title"]', seoTitle)
    setMeta('meta[property="og:description"]', seoDescription)
    setMeta('meta[property="og:image"]', shareImage)
    setMeta('meta[name="twitter:title"]', seoTitle)
    setMeta('meta[name="twitter:description"]', seoDescription)
    setMeta('meta[name="twitter:image"]', shareImage)
  }, [page, pageTitle])

  if (loading) {
    return <RichContentPageSkeleton sectionLabel={ABOUT_SECTION_LABEL} />
  }

  if (error?.status === 404 || !page) {
    return (
      <section className="bg-background py-10 sm:py-12 lg:py-16">
        <div className="container max-w-5xl space-y-8">
          <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">{ABOUT_SECTION_LABEL}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">{pageTitle}</h1>
          </header>
          <EmptyState
            title={PUBLIC_UI_LABELS.contentNotAvailableTitle}
            description={PUBLIC_UI_LABELS.contentNotAvailableDescription}
          />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="bg-background py-10 sm:py-12 lg:py-16">
        <div className="container max-w-5xl space-y-8">
          <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">{ABOUT_SECTION_LABEL}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">{pageTitle}</h1>
          </header>
          <ErrorState
            title={PUBLIC_UI_LABELS.unableToLoadContentTitle}
            message={error?.message || PUBLIC_UI_LABELS.unableToLoadContentMessage}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="bg-background py-10 sm:py-12 lg:py-16">
      <div className="container max-w-5xl space-y-8">
        <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">{ABOUT_SECTION_LABEL}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">{pageTitle}</h1>
          {page.subtitle ? (
            <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">{page.subtitle}</p>
          ) : null}
        </header>

        <div className="rounded-2xl border border-border/70 bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-9 md:px-12">
          <RichTextRenderer html={page?.body || ''} />
        </div>
      </div>
    </section>
  )
}
