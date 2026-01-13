import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHallOfFameDetail } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

function HallOfFameDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadEntry = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getHallOfFameDetail(slug)
        if (!isMounted) {
          return
        }

        // Some APIs wrap the entity in a data field.
        setItem(response?.data || response?.item || response)
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

    if (slug) {
      loadEntry()
    } else {
      setLoading(false)
      setError(new Error('Missing hall of fame slug.'))
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  // Gather descriptive fields the backend might return.
  const details = useMemo(() => {
    if (!item) {
      return []
    }

    return [
      item?.bio,
      item?.description,
      item?.achievements,
      item?.summary,
    ].filter(Boolean)
  }, [item])

  // Prefer medium image, then fall back to any available image field.
  const imagePath =
    item?.images?.medium || item?.images?.large || item?.image || item?.photo
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  if (loading) {
    return (
      <section>
        <h1>Hall of Fame</h1>
        <p>Loading hall of fame entry...</p>
      </section>
    )
  }

  if (error) {
    const notFound = error?.status === 404
    return (
      <section>
        <h1>Hall of Fame</h1>
        {notFound ? (
          <>
            <p>Sorry, that entry was not found.</p>
            <p>
              <Link to="/hall-of-fame">Back to hall of fame</Link>
            </p>
          </>
        ) : (
          <>
            <p>Unable to load this entry.</p>
            <pre>{error?.message || String(error)}</pre>
          </>
        )}
      </section>
    )
  }

  return (
    <section>
      <h1>{item?.full_name || item?.name || 'Hall of Fame'}</h1>
      {imageUrl && (
        <img src={imageUrl} alt={item?.full_name || item?.name || 'Entry'} />
      )}
      {details.length > 0 ? (
        details.map((detail, index) => <p key={index}>{detail}</p>)
      ) : (
        <p>No biography available.</p>
      )}
    </section>
  )
}

export default HallOfFameDetail
