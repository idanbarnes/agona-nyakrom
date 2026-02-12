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

const sanitizeHtml = (html = '') =>
  String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')

export default function AboutRichPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [lightbox, setLightbox] = useState('')

  useEffect(() => {
    getAboutPageBySlug(slug).then((res) => setPage(res.data || res)).catch(() => setPage(null))
  }, [slug])

  const body = useMemo(() => sanitizeHtml(page?.body || ''), [page])

  useEffect(() => {
    const root = document.getElementById('about-rich-content')
    if (!root) return
    const images = root.querySelectorAll('img')
    images.forEach((img) => {
      img.loading = 'lazy'
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.margin = '1rem 0'
      img.style.cursor = 'zoom-in'
      const src = resolveAssetUrl(img.getAttribute('src') || '')
      img.src = src
      img.onclick = () => setLightbox(src)
    })
  }, [body])

  if (!page) return <section className="container py-10"><h1>{titles[slug] || 'About Nyakrom'}</h1><p>Content not available.</p></section>

  return <section className="container py-10">
    <h1 className="text-3xl font-semibold">{page.page_title || titles[slug]}</h1>
    {page.subtitle ? <p className="text-muted-foreground">{page.subtitle}</p> : null}
    <article id="about-rich-content" className="prose max-w-none" dangerouslySetInnerHTML={{ __html: body }} />
    <ImageLightbox open={Boolean(lightbox)} onClose={() => setLightbox('')} src={lightbox} alt={page.page_title || titles[slug]} />
  </section>
}
