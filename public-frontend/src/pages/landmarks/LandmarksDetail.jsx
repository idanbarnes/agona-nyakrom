import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLandmarkDetail } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

// Prefer medium image, then fall back to any available image field.
function selectImage(images = {}, fallback) {
  if (images?.medium) {
    return images.medium
  }

  if (images?.large) {
    return images.large
  }

  if (images?.original) {
    return images.original
  }

  return fallback
}

function LandmarksDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadLandmark = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getLandmarkDetail(slug)
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
      loadLandmark()
    } else {
      setLoading(false)
      setError(new Error('Missing landmark slug.'))
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  const name = item?.name || item?.title || 'Landmark'
  const imagePath = selectImage(item?.images, item?.image)
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  if (loading) {
    return (
      <section>
        <h1>Landmark</h1>
        <p>Loading landmark...</p>
      </section>
    )
  }

  if (error) {
    const notFound = error?.status === 404
    return (
      <section>
        <h1>Landmark</h1>
        {notFound ? (
          <>
            <p>Sorry, that landmark was not found.</p>
            <p>
              <Link to="/landmarks">Back to landmarks</Link>
            </p>
          </>
        ) : (
          <>
            <p>Unable to load this landmark.</p>
            <pre>{error?.message || String(error)}</pre>
          </>
        )}
      </section>
    )
  }

  return (
    <section>
      <h1>{name}</h1>
      {imageUrl && <img src={imageUrl} alt={name} />}
      {item?.description ? (
        <p>{item.description}</p>
      ) : (
        <p>No description available.</p>
      )}
      {item?.location && <p>Location: {item.location}</p>}
      {item?.google_map_link && (
        <p>
          <a
            href={item.google_map_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Google Maps
          </a>
        </p>
      )}
    </section>
  )
}

export default LandmarksDetail
