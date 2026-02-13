import { useMemo, useRef, useState } from 'react'
import ImageLightbox from './ImageLightbox.jsx'
import { API_BASE_URL } from '../lib/apiBase.js'

const BLOCKED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea'])

const SAFE_IMAGE_SRC = /^(https?:|data:image\/|blob:|\/|\.\/|\.\.\/|[^\s]+$)/i
const SAFE_LINK_HREF = /^(https?:|mailto:|tel:|\/|#|\.\/|\.\.\/|[^\s]+$)/i

function isAllowedUrl(value = '', type = 'href') {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  if (/^javascript:/i.test(trimmed)) {
    return false
  }

  if (type === 'src') {
    return SAFE_IMAGE_SRC.test(trimmed)
  }

  return SAFE_LINK_HREF.test(trimmed)
}

function normalizeImageSource(src = '') {
  const rawSrc = src.trim()
  if (!rawSrc) {
    return rawSrc
  }

  if (/^(https?:|data:image\/|blob:)/i.test(rawSrc)) {
    return rawSrc
  }

  const normalizedPath = rawSrc.startsWith('/') ? rawSrc : `/${rawSrc}`
  const base = (API_BASE_URL || '').trim().replace(/\/$/, '')

  if (/^https?:\/\//i.test(base)) {
    return `${base}${normalizedPath}`
  }

  return normalizedPath
}

function sanitizeRichHtml(html = '') {
  if (typeof window === 'undefined') {
    return ''
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(String(html), 'text/html')

  doc.querySelectorAll('*').forEach((node) => {
    const tag = node.tagName.toLowerCase()

    if (BLOCKED_TAGS.has(tag)) {
      node.remove()
      return
    }

    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase()
      const value = attr.value

      if (name.startsWith('on')) {
        node.removeAttribute(attr.name)
        continue
      }

      if (name === 'href' && value && !isAllowedUrl(value, 'href')) {
        node.removeAttribute(attr.name)
      }

      if (name === 'src' && value && !isAllowedUrl(value, 'src')) {
        node.removeAttribute(attr.name)
      }

      if (name === 'style') {
        const safeStyles = value
          .split(';')
          .map((part) => part.trim())
          .filter((part) => /^text-align\s*:\s*(left|right|center|justify)$/i.test(part))

        if (safeStyles.length > 0) {
          node.setAttribute('style', safeStyles.join('; '))
        } else {
          node.removeAttribute('style')
        }
      }
    }

    if (tag === 'a') {
      node.setAttribute('rel', 'noopener noreferrer')
      if (node.getAttribute('href')?.startsWith('http')) {
        node.setAttribute('target', '_blank')
      }
    }

    if (tag === 'img') {
      node.setAttribute('loading', 'lazy')
      node.setAttribute('decoding', 'async')
      const rawSrc = node.getAttribute('src') || ''
      node.setAttribute('src', normalizeImageSource(rawSrc))
    }
  })

  return doc.body.innerHTML
}

function getImageMeta(imageNode) {
  const figure = imageNode.closest('figure')
  const caption = figure?.querySelector('figcaption')?.textContent?.trim() || ''

  return {
    src: imageNode.getAttribute('src') || '',
    alt: imageNode.getAttribute('alt') || caption || 'History image',
    caption,
  }
}

export default function RichTextRenderer({ html = '' }) {
  const contentRef = useRef(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  const sanitizedHtml = useMemo(() => sanitizeRichHtml(html), [html])

  const onContentClick = (event) => {
    const root = contentRef.current
    if (!root) {
      return
    }

    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const imageNode = target.closest('img')
    if (!imageNode || !root.contains(imageNode)) {
      return
    }

    const src = imageNode.currentSrc || imageNode.getAttribute('src')
    if (!src) {
      return
    }

    setLightboxImage(getImageMeta(imageNode))
  }

  return (
    <>
      <article
        ref={contentRef}
        onClick={onContentClick}
        className="rich-text-content text-[1.04rem] leading-8 text-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
      <ImageLightbox
        open={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        src={lightboxImage?.src || ''}
        alt={lightboxImage?.alt || 'Expanded image'}
        caption={lightboxImage?.caption || ''}
      />
    </>
  )
}
