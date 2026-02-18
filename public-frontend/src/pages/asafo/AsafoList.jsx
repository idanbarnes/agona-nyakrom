import { useEffect, useMemo, useState } from 'react'
import { getAsafoCompanies } from '../../api/endpoints.js'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
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

export default function AsafoList() {
  const [items, setItems] = useState([])

  useEffect(() => {
    getAsafoCompanies().then((res) => setItems(res?.data || []))
  }, [])

  const sections = useMemo(() => {
    const byKey = new Map(items.map((item) => [item.company_key || item.entry_type, item]))
    return [
      byKey.get('introduction') || items.find((item) => item.entry_type === 'introduction') || null,
      byKey.get('adonten') || null,
      byKey.get('kyeremu') || null,
    ]
  }, [items])

  const intro = sections[0]

  useEffect(() => {
    const seoTitle = intro?.seo_meta_title || intro?.title || 'Asafo Company'
    const seoDescription = intro?.seo_meta_description || intro?.subtitle || ''
    const fallbackBodyImage = extractFirstImageSrc(intro?.body || '')
    const shareImage = resolveAssetUrl(intro?.seo_share_image || fallbackBodyImage || DEFAULT_SHARE_IMAGE)

    document.title = seoTitle
    setMeta('meta[name="description"]', seoDescription)
    setMeta('meta[property="og:title"]', seoTitle)
    setMeta('meta[property="og:description"]', seoDescription)
    setMeta('meta[property="og:image"]', shareImage)
    setMeta('meta[name="twitter:title"]', seoTitle)
    setMeta('meta[name="twitter:description"]', seoDescription)
    setMeta('meta[name="twitter:image"]', shareImage)
  }, [intro])

  const labels = ['Introduction', 'Adonten', 'Kyeremu']

  return (
    <section className="bg-background py-10 sm:py-12 lg:py-16">
      <div className="container max-w-5xl space-y-8">
        <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">Asafo Company</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">Asafo Company</h1>
        </header>

        {sections.map((section, index) => (
          <div key={labels[index]} className="rounded-2xl border border-border/70 bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-9 md:px-12">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{section?.title || labels[index]}</h2>
            {section?.subtitle ? <p className="mt-2 text-muted-foreground">{section.subtitle}</p> : null}
            <div className="mt-4">
              <RichTextRenderer html={section?.body || ''} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
