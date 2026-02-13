import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import { getAboutPageBySlug } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

const titles = {
  history: 'History',
  'who-we-are': 'Who We Are',
  'about-agona-nyakrom-town': 'About Agona Nyakrom Town',
}

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

  useEffect(() => {
    let cancelled = false

    if (!titles[slug]) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setPage(null)
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
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPage(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const pageTitle = useMemo(
    () => page?.page_title || titles[slug] || 'About Nyakrom',
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

  if (!page) {
    return (
      <section className="container py-10 sm:py-12 lg:py-16">
        <h1 className="text-3xl font-semibold md:text-4xl">{pageTitle}</h1>
        <p className="mt-3 text-muted-foreground">Content not available.</p>
      </section>
    )
  }

  return (
    <section className="bg-background py-10 sm:py-12 lg:py-16">
      <div className="container max-w-5xl space-y-8">
        <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">About Nyakrom</p>
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
