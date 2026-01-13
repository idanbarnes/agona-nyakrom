import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getNewsDetail } from '../../api/endpoints.js'
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

function NewsDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadNews = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getNewsDetail(slug)
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
      loadNews()
    } else {
      setLoading(false)
      setError(new Error('Missing news slug.'))
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  const publishedAt = item?.published_at || item?.publishedAt
  const dateLabel = useMemo(() => formatDate(publishedAt), [publishedAt])
  const imagePath = selectImage(item?.images, item?.image)
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  if (loading) {
    return (
      <section>
        <h1>News Detail</h1>
        <p>Loading news story...</p>
      </section>
    )
  }

  if (error) {
    const notFound = error?.status === 404
    return (
      <section>
        <h1>News Detail</h1>
        {notFound ? (
          <>
            <p>Sorry, that news story was not found.</p>
            <p>
              <Link to="/news">Back to news</Link>
            </p>
          </>
        ) : (
          <>
            <p>Unable to load this news story.</p>
            <pre>{error?.message || String(error)}</pre>
          </>
        )}
      </section>
    )
  }

  return (
    <section>
      <h1>{item?.title || 'News Detail'}</h1>
      {item?.reporter && (
        <p>
          <strong>Reporter:</strong> {item.reporter}
        </p>
      )}
      {dateLabel && <p>Published: {dateLabel}</p>}
      {imageUrl && <img src={imageUrl} alt={item?.title || 'News image'} />}
      {item?.content ? <p>{item.content}</p> : <p>No content available.</p>}
    </section>
  )
}

export default NewsDetail
