import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLandmarks } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

// Normalize the location field to a readable string.
function formatLocation(value) {
  if (!value) {
    return ''
  }

  return typeof value === 'string' ? value : JSON.stringify(value)
}

// Extract list data across possible payload shapes.
function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return (
    payload.items ||
    payload.data ||
    payload.results ||
    payload.landmarks ||
    []
  )
}

// Provide a brief fallback summary when only a long description is available.
function getShortDescription(item) {
  if (item?.short_description) {
    return item.short_description
  }

  if (item?.description) {
    const trimmed =
      item.description.length > 180
        ? `${item.description.slice(0, 180).trim()}...`
        : item.description
    return trimmed
  }

  return ''
}

function LandmarksList() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadLandmarks = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getLandmarks({ page, limit })
        if (!isMounted) {
          return
        }

        const payload = response?.data || response
        setItems(extractItems(payload))
        // Capture pagination metadata when the backend includes it.
        setMeta(payload?.meta || payload?.pagination || response?.meta || null)
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

    loadLandmarks()

    return () => {
      isMounted = false
    }
  }, [limit, page])

  const hasNextPage = useMemo(() => {
    if (meta?.hasNextPage !== undefined) {
      return Boolean(meta.hasNextPage)
    }

    if (meta?.totalPages) {
      return page < meta.totalPages
    }

    if (meta?.total) {
      return page * limit < meta.total
    }

    // Fallback: if we received fewer items than the limit, assume no more pages.
    return items.length >= limit
  }, [items.length, limit, meta, page])

  if (loading) {
    return (
      <section>
        <h1>Landmarks</h1>
        <p>Loading landmarks...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>Landmarks</h1>
        <p>Unable to load landmarks.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  return (
    <section>
      <h1>Landmarks</h1>
      {items.length === 0 ? (
        <p>No landmarks available.</p>
      ) : (
        <ul>
          {items.map((item) => {
            const name = item?.name || item?.title || 'Untitled'
            const slug = item?.slug
            const location = formatLocation(item?.location)
            const thumbnail = item?.images?.thumbnail || item?.thumbnail
            const description = getShortDescription(item)

            return (
              <li key={item?.id || slug || name}>
                {thumbnail && (
                  <img
                    src={resolveAssetUrl(thumbnail)}
                    alt={name || 'Landmark thumbnail'}
                  />
                )}
                <h2>
                  {slug ? (
                    <Link to={`/landmarks/${slug}`}>{name}</Link>
                  ) : (
                    name
                  )}
                </h2>
                {description && <p>{description}</p>}
                {location && <p>Location: {location}</p>}
              </li>
            )
          })}
        </ul>
      )}

      <nav aria-label="Landmarks pagination">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </nav>
    </section>
  )
}

export default LandmarksList
