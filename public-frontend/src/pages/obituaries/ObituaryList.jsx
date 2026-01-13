import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getObituaries } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

// Format date strings to a readable format when valid.
function formatDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString()
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
    payload.obituaries ||
    []
  )
}

// Provide a brief fallback summary when no explicit summary exists.
function getSummary(item) {
  if (item?.summary) {
    return item.summary
  }

  const bio = item?.biography || ''
  if (!bio) {
    return ''
  }

  const trimmed = bio.length > 180 ? `${bio.slice(0, 180).trim()}...` : bio
  return trimmed
}

function ObituaryList() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadObituaries = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getObituaries({ page, limit })
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

    loadObituaries()

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
        <h1>Obituaries</h1>
        <p>Loading obituaries...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>Obituaries</h1>
        <p>Unable to load obituaries.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  return (
    <section>
      <h1>Obituaries</h1>
      {items.length === 0 ? (
        <p>No obituaries available.</p>
      ) : (
        <ul>
          {items.map((item) => {
            const dateOfDeath = formatDate(item?.date_of_death)
            const thumbnail = item?.images?.thumbnail || item?.thumbnail
            const slug = item?.slug
            const summary = getSummary(item)

            return (
              <li key={item?.id || slug || item?.full_name}>
                {thumbnail && (
                  <img
                    src={resolveAssetUrl(thumbnail)}
                    alt={item?.full_name || 'Obituary thumbnail'}
                  />
                )}
                <h2>
                  {slug ? (
                    <Link to={`/obituaries/${slug}`}>
                      {item?.full_name || 'Unnamed'}
                    </Link>
                  ) : (
                    item?.full_name || 'Unnamed'
                  )}
                </h2>
                {item?.age && <p>Age: {item.age}</p>}
                {dateOfDeath && <p>Date of death: {dateOfDeath}</p>}
                {summary && <p>{summary}</p>}
              </li>
            )
          })}
        </ul>
      )}

      <nav aria-label="Obituaries pagination">
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

export default ObituaryList
