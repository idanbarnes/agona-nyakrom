import { useMemo, useRef, useState } from 'react'
import ImageLightbox from './ImageLightbox.jsx'
import { resolveAssetUrl } from '../lib/apiBase.js'

const BLOCKED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea'])
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i

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

      if ((name === 'href' || name === 'src') && value && !SAFE_URL.test(value)) {
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
      node.setAttribute('src', resolveAssetUrl(rawSrc))
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

    const src = imageNode.getAttribute('src')
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
