import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAsafoCompanies } from '../../api/endpoints.js'
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
    payload.asafo_companies ||
    payload.asafoCompanies ||
    []
  )
}

// Provide a brief fallback when only a long description is available.
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

function AsafoList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadCompanies = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getAsafoCompanies()
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

    loadCompanies()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <section>
        <h1>Asafo Companies</h1>
        <p>Loading asafo companies...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>Asafo Companies</h1>
        <p>Unable to load asafo companies.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  return (
    <section>
      <h1>Asafo Companies</h1>
      {items.length === 0 ? (
        <p>No asafo companies available.</p>
      ) : (
        <ul>
          {items.map((item) => {
            const thumbnail = item?.images?.thumbnail || item?.thumbnail
            const slug = item?.slug
            const description = getShortDescription(item)

            return (
              <li key={item?.id || slug || item?.name}>
                {thumbnail && (
                  <img
                    src={resolveAssetUrl(thumbnail)}
                    alt={item?.name || 'Asafo company thumbnail'}
                  />
                )}
                <h2>
                  {slug ? (
                    <Link to={`/asafo-companies/${slug}`}>
                      {item?.name || 'Unnamed company'}
                    </Link>
                  ) : (
                    item?.name || 'Unnamed company'
                  )}
                </h2>
                {description && <p>{description}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default AsafoList
