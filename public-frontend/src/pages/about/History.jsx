import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

// Consider several flags that backends use for publish state.
function isUnpublished(history) {
  return (
    history?.published === false ||
    history?.is_published === false ||
    history?.status === 'draft'
  )
}

// Prefer large images, falling back through common image sizes.
function selectHeroImage(history) {
  const images = history?.images || {}

  return (
    images.large ||
    images.medium ||
    images.thumbnail ||
    images.original ||
    history?.hero_image ||
    history?.image ||
    ''
  )
}

// Normalize highlights across array/object/string payloads.
function normalizeHighlights(highlights) {
  if (!highlights) {
    return []
  }

  if (Array.isArray(highlights)) {
    return highlights.filter(Boolean)
  }

  if (typeof highlights === 'object') {
    return Object.entries(highlights).map(([title, detail]) => ({
      title,
      detail,
    }))
  }

  if (typeof highlights === 'string') {
    return [highlights]
  }

  return []
}

function History() {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getHistory()
        if (!isMounted) {
          return
        }

        setHistory(response?.data || response)
      } catch (err) {
        if (isMounted) {
          setError(err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const highlights = useMemo(
    () => normalizeHighlights(history?.highlights),
    [history],
  )
  const heroImagePath = selectHeroImage(history)
  const heroImageUrl = heroImagePath ? resolveAssetUrl(heroImagePath) : ''
  const sectionClassName = 'container space-y-4 py-6 md:py-10'
  const titleClassName =
    'text-2xl font-semibold text-foreground break-words md:text-3xl'

  if (loading) {
    return (
      <section className={sectionClassName}>
        <h1 className={titleClassName}>History</h1>
        <p className="text-sm text-muted-foreground">Loading history...</p>
      </section>
    )
  }

  if (error) {
    if (error?.status === 404) {
      return (
        <section className={sectionClassName}>
          <h1 className={titleClassName}>History</h1>
          <p className="text-sm text-muted-foreground">
            History content not available yet.
          </p>
        </section>
      )
    }

    return (
      <section className={sectionClassName}>
        <h1 className={titleClassName}>History</h1>
        <p className="text-sm text-muted-foreground">
          Unable to load history content.
        </p>
        <pre className="text-sm text-muted-foreground">
          {error?.message || String(error)}
        </pre>
      </section>
    )
  }

  if (!history || isUnpublished(history)) {
    return (
      <section className={sectionClassName}>
        <h1 className={titleClassName}>History</h1>
        <p className="text-sm text-muted-foreground">
          History content not available yet.
        </p>
      </section>
    )
  }

  const title = history?.title || history?.name || 'History'
  const subtitle = history?.subtitle || history?.tagline
  const content = history?.content || history?.body || history?.description

  return (
    <section className={sectionClassName}>
      <h1 className={titleClassName}>{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
      {heroImageUrl && (
        <img
          src={heroImageUrl}
          alt={title}
          className="w-full rounded-xl border border-border object-cover"
        />
      )}
      {content ? (
        <p
          className="leading-7 text-foreground"
          style={{ whiteSpace: 'pre-line' }}
        >
          {content}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No history content available.
        </p>
      )}
      {highlights.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Highlights</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {highlights.map((item, index) => {
              if (typeof item === 'string') {
                return <li key={item}>{item}</li>
              }

              return (
                <li key={item?.title || index}>
                  <strong>{item?.title}</strong>
                  {item?.detail ? `: ${item.detail}` : ''}
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <p>
        <Link to="/">Back to home</Link>
      </p>
    </section>
  )
}

export default History
