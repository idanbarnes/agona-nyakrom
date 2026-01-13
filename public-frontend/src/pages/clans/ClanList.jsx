import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClans } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

// Extract list data across possible payload shapes.
function extractItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  return payload.items || payload.data || payload.results || payload.clans || []
}

function ClanList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadClans = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getClans()
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

    loadClans()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <section>
        <h1>Clans</h1>
        <p>Loading clans...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>Clans</h1>
        <p>Unable to load clans.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  return (
    <section>
      <h1>Clans</h1>
      {items.length === 0 ? (
        <p>No clans available.</p>
      ) : (
        <ul>
          {items.map((item) => {
            const thumbnail = item?.images?.thumbnail || item?.thumbnail
            const slug = item?.slug

            return (
              <li key={item?.id || slug || item?.name}>
                {thumbnail && (
                  <img
                    src={resolveAssetUrl(thumbnail)}
                    alt={item?.name || 'Clan thumbnail'}
                  />
                )}
                <h2>
                  {slug ? (
                    <Link to={`/clans/${slug}`}>
                      {item?.name || 'Unnamed clan'}
                    </Link>
                  ) : (
                    item?.name || 'Unnamed clan'
                  )}
                </h2>
                {item?.intro && <p>{item.intro}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ClanList
