import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNews } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

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

function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return payload.items || payload.data || payload.results || payload.news || []
}

function NewsList() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadNews = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getNews({ page, limit })
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

    loadNews()

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
        <h1>News</h1>
        <p>Loading news...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>News</h1>
        <p>Unable to load news.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  return (
    <section>
      <h1>News</h1>
      {items.length === 0 ? (
        <p>No news items available.</p>
      ) : (
        <ul>
          {items.map((item) => {
            const publishedAt =
              item?.published_at || item?.publishedAt || item?.createdAt
            const dateLabel = formatDate(publishedAt)
            const thumbnail = item?.images?.thumbnail
            const slug = item?.slug

            return (
              <li key={item?.id || slug || item?.title}>
                {thumbnail && (
                  <img
                    src={resolveAssetUrl(thumbnail)}
                    alt={item?.title || 'News thumbnail'}
                  />
                )}
                <h2>
                  {slug ? (
                    <Link to={`/news/${slug}`}>
                      {item?.title || 'Untitled'}
                    </Link>
                  ) : (
                    item?.title || 'Untitled'
                  )}
                </h2>
                {item?.summary && <p>{item.summary}</p>}
                {dateLabel && <p>Published: {dateLabel}</p>}
              </li>
            )
          })}
        </ul>
      )}

      <nav aria-label="News pagination">
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

export default NewsList
