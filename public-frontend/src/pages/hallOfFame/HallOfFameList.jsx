import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHallOfFame } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

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
    payload.hall_of_fame ||
    payload.hallOfFame ||
    []
  )
}

// Provide a brief summary across common field names.
function getSummary(item) {
  const summary =
    item?.summary || item?.short_bio || item?.shortBio || item?.bio
  if (summary) {
    return summary
  }

  const description = item?.description || item?.achievements || ''
  if (!description) {
    return ''
  }

  return description.length > 180
    ? `${description.slice(0, 180).trim()}...`
    : description
}

function HallOfFameList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadHallOfFame = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getHallOfFame()
        if (!isMounted) {
          return
        }

        const payload = response?.data || response
        setItems(extractItems(payload))
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

    loadHallOfFame()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <section>
        <h1>Hall of Fame</h1>
        <p>Loading hall of fame entries...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>Hall of Fame</h1>
        <p>Unable to load hall of fame entries.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  return (
    <section>
      <h1>Hall of Fame</h1>
      {items.length === 0 ? (
        <p>No entries available.</p>
      ) : (
        <ul>
          {items.map((item) => {
            const thumbnail = item?.images?.thumbnail || item?.thumbnail
            const slug = item?.slug
            const name = item?.full_name || item?.name || 'Unnamed'
            const summary = getSummary(item)

            return (
              <li key={item?.id || slug || name}>
                {thumbnail && (
                  <img
                    src={resolveAssetUrl(thumbnail)}
                    alt={`${name} thumbnail`}
                  />
                )}
                <h2>
                  {slug ? (
                    <Link to={`/hall-of-fame/${slug}`}>{name}</Link>
                  ) : (
                    name
                  )}
                </h2>
                {summary && <p>{summary}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default HallOfFameList
