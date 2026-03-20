import { useEffect, useMemo, useState } from 'react'
import { getAsafoCompanies } from '../../api/endpoints.js'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import { EmptyState, ErrorState, RichContentPageSkeleton } from '../../components/ui/index.jsx'
import {
  ABOUT_SECTION_LABEL,
  PUBLIC_UI_LABELS,
} from '../../constants/publicChrome.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'
import { formatDocumentTitle } from '../../lib/pageTitle.js'

const DEFAULT_SHARE_IMAGE = '/share-default.svg'

function normalizeTuafoTitle(value, fallback = 'Tuafo Asafo Company') {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) {
    return fallback
  }

  if (normalizedValue === 'Kyeremu Asafo' || normalizedValue === 'Kyeremu Asafo Company') {
    return 'Tuafo Asafo Company'
  }

  return normalizedValue
}

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

export default function AsafoList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')

    getAsafoCompanies()
      .then((res) => {
        if (cancelled) {
          return
        }

        setItems(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((fetchError) => {
        if (cancelled) {
          return
        }

        setItems([])
        setError(fetchError?.message || 'Failed to load Asafo Companies content.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const sections = useMemo(() => {
    const intro =
      items.find((item) => item.entry_type === 'introduction') || null
    const adonsten =
      items.find((item) =>
        ['adonten', 'adonsten', 'dotsen'].includes(
          String(item.company_key || '').toLowerCase(),
        ),
      ) || null
    const kyeremu =
      items.find(
        (item) => String(item.company_key || '').toLowerCase() === 'kyeremu',
      ) || null

    return [
      {
        id: 'who-are-asafo-companies',
        label: 'Who Are Asafo Companies',
        item: intro,
      },
      { id: 'adonsten-asafo', label: 'Adonsten Asafo', item: adonsten },
      { id: 'kyeremu-asafo', label: 'Tuafo Asafo Company', item: kyeremu },
    ]
  }, [items])

  const intro = sections[0]?.item

  useEffect(() => {
    const seoTitle =
      intro?.seo_meta_title || intro?.title || 'Asafo Companies'
    const seoDescription = intro?.seo_meta_description || intro?.subtitle || ''
    const fallbackBodyImage = extractFirstImageSrc(intro?.body || '')
    const shareImage = resolveAssetUrl(intro?.seo_share_image || fallbackBodyImage || DEFAULT_SHARE_IMAGE)

    document.title = formatDocumentTitle(seoTitle)
    setMeta('meta[name="description"]', seoDescription)
    setMeta('meta[property="og:title"]', seoTitle)
    setMeta('meta[property="og:description"]', seoDescription)
    setMeta('meta[property="og:image"]', shareImage)
    setMeta('meta[name="twitter:title"]', seoTitle)
    setMeta('meta[name="twitter:description"]', seoDescription)
    setMeta('meta[name="twitter:image"]', shareImage)
  }, [intro])

  return (
    <section className="bg-background py-10 sm:py-12 lg:py-16">
      <div className="container max-w-5xl space-y-8">
        <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">{ABOUT_SECTION_LABEL}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">Asafo Companies</h1>
        </header>

        {loading ? (
          <RichContentPageSkeleton
            contentOnly
            className="pt-0"
            sectionLabel={null}
            showSubtitle={false}
            sections={3}
          />
        ) : error ? (
          <ErrorState
            title="Unable to load Asafo Companies"
            message={error || PUBLIC_UI_LABELS.unableToLoadContentMessage}
          />
        ) : sections.every((section) => !section.item) ? (
          <EmptyState
            title="No Asafo content available"
            description="Asafo Companies content has not been published yet."
          />
        ) : (
          sections.map((section) => (
            <div key={section.id} className="rounded-2xl border border-border/70 bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-9 md:px-12">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {section.id === 'kyeremu-asafo'
                  ? normalizeTuafoTitle(section.item?.title, section.label)
                  : section.item?.title || section.label}
              </h2>
            {section.item?.subtitle ? <p className="mt-2 text-muted-foreground">{section.item.subtitle}</p> : null}
            <div className="mt-4">
              <RichTextRenderer html={section.item?.body || ''} />
            </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
