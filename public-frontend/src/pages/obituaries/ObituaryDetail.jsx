import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getObituaryDetail } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

function ObituaryDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadObituary = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getObituaryDetail(slug)
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
      loadObituary()
    } else {
      setLoading(false)
      setError(new Error('Missing obituary slug.'))
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  // Memoize date parsing to avoid repeated Date construction on re-renders.
  const dateOfBirth = useMemo(
    () => (item?.date_of_birth ? new Date(item.date_of_birth) : null),
    [item?.date_of_birth],
  )
  const dateOfDeath = useMemo(
    () => (item?.date_of_death ? new Date(item.date_of_death) : null),
    [item?.date_of_death],
  )
  const funeralDate = useMemo(
    () => (item?.funeral_date ? new Date(item.funeral_date) : null),
    [item?.funeral_date],
  )
  const burialDate = useMemo(
    () => (item?.burial_date ? new Date(item.burial_date) : null),
    [item?.burial_date],
  )

  // Format dates consistently when a valid date is available.
  const formatDate = (date) =>
    date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null

  // Prefer medium image, then fall back to any available image field.
  const imagePath =
    item?.images?.medium || item?.images?.large || item?.image || item?.photo
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  if (loading) {
    return (
      <section>
        <h1>Obituary</h1>
        <p>Loading obituary...</p>
      </section>
    )
  }

  if (error) {
    const notFound = error?.status === 404
    return (
      <section>
        <h1>Obituary</h1>
        {notFound ? (
          <>
            <p>Sorry, that obituary was not found.</p>
            <p>
              <Link to="/obituaries">Back to obituaries</Link>
            </p>
          </>
        ) : (
          <>
            <p>Unable to load this obituary.</p>
            <pre>{error?.message || String(error)}</pre>
          </>
        )}
      </section>
    )
  }

  return (
    <section>
      <h1>{item?.full_name || 'Obituary'}</h1>
      {item?.age && <p>Age: {item.age}</p>}
      {formatDate(dateOfBirth) && (
        <p>Date of birth: {formatDate(dateOfBirth)}</p>
      )}
      {formatDate(dateOfDeath) && (
        <p>Date of death: {formatDate(dateOfDeath)}</p>
      )}
      {formatDate(funeralDate) && (
        <p>Funeral date: {formatDate(funeralDate)}</p>
      )}
      {formatDate(burialDate) && (
        <p>Burial date: {formatDate(burialDate)}</p>
      )}
      {imageUrl && (
        <img src={imageUrl} alt={item?.full_name || 'Obituary'} />
      )}
      {item?.biography ? <p>{item.biography}</p> : <p>No biography provided.</p>}
    </section>
  )
}

export default ObituaryDetail
