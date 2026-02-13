import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ImageLightbox from '../../components/ImageLightbox.jsx'
import { getAboutPageBySlug } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

const titles = {
  history: 'History',
  'who-we-are': 'Who We Are',
  'about-agona-nyakrom-town': 'About Agona Nyakrom Town',
}

const DEFAULT_SHARE_IMAGE = '/share-default.svg'

const sanitizeHtml = (html = '') =>
  String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')

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
  const [lightbox, setLightbox] = useState('')

  useEffect(() => {
    if (!titles[slug]) {
      setPage(null)
      return
    }
    getAboutPageBySlug(slug)
      .then((res) => setPage(res.data || res))
      .catch(() => setPage(null))
  }, [slug])

  const body = useMemo(() => sanitizeHtml(page?.body || ''), [page])

  useEffect(() => {
    const root = document.getElementById('about-rich-content')
    if (!root) return
    const images = root.querySelectorAll('img')
    images.forEach((img) => {
      img.loading = 'lazy'
      img.decoding = 'async'
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.margin = '1.5rem 0'
      img.style.cursor = 'zoom-in'
      img.style.display = 'block'
      const src = resolveAssetUrl(img.getAttribute('src') || '')
      img.src = src
      img.onclick = () => setLightbox(src)
    })
  }, [body])

  useEffect(() => {
    const pageTitle = page?.page_title || titles[slug] || 'About Nyakrom'
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
  }, [page, slug])

  if (!page) {
    return (
      <section className="container py-10">
        <h1 className="text-3xl font-semibold">{titles[slug] || 'About Nyakrom'}</h1>
        <p>Content not available.</p>
      </section>
    )
  }

  return (
    <section className="container py-10">
      <h1 className="text-3xl font-semibold">{page.page_title || titles[slug]}</h1>
      {page.subtitle ? <p className="mt-2 text-muted-foreground">{page.subtitle}</p> : null}
      <article
        id="about-rich-content"
        className="prose mt-6 max-w-none prose-headings:mt-8 prose-headings:mb-3 prose-p:my-4 prose-li:my-1 prose-blockquote:my-6 prose-figure:my-6 prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <ImageLightbox
        open={Boolean(lightbox)}
        onClose={() => setLightbox('')}
        src={lightbox}
        alt={page.page_title || titles[slug]}
      />
    </section>
  )
}
