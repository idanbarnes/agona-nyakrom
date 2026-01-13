import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClanDetail } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

const EMPTY_LEADERS = { current: [], past: [] }

function ClanDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadClan = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getClanDetail(slug)
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
      loadClan()
    } else {
      setLoading(false)
      setError(new Error('Missing clan slug.'))
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  // Prefer medium image, then fall back to any available image field.
  const imagePath =
    item?.images?.medium || item?.images?.large || item?.image || item?.photo
  const imageUrl = imagePath ? resolveAssetUrl(imagePath) : null

  if (loading) {
    return (
      <section>
        <h1>Clan</h1>
        <p>Loading clan...</p>
      </section>
    )
  }

  if (error) {
    const notFound = error?.status === 404
    return (
      <section>
        <h1>Clan</h1>
        {notFound ? (
          <>
            <p>Sorry, that clan was not found.</p>
            <p>
              <Link to="/clans">Back to clans</Link>
            </p>
          </>
        ) : (
          <>
            <p>Unable to load this clan.</p>
            <pre>{error?.message || String(error)}</pre>
          </>
        )}
      </section>
    )
  }

  return (
    <section>
      <h1>{item?.name || 'Clan'}</h1>
      {imageUrl && <img src={imageUrl} alt={item?.name || 'Clan'} />}
      {item?.history ? <p>{item.history}</p> : <p>No history available.</p>}
      {item?.key_contributions && (
        <section>
          <h2>Key Contributions</h2>
          <p>{item.key_contributions}</p>
        </section>
      )}
      <section>
        <h2>Current Leaders</h2>
        {(item?.leaders?.current || EMPTY_LEADERS.current).length === 0 ? (
          <p>No current leaders listed.</p>
        ) : (
          <div>
            {(item?.leaders?.current || EMPTY_LEADERS.current).map((leader) => {
              const leaderImage =
                leader?.images?.medium ||
                leader?.images?.large ||
                leader?.images?.thumbnail ||
                leader?.images?.original ||
                ''
              const leaderImageUrl = leaderImage
                ? resolveAssetUrl(leaderImage)
                : ''

              return (
                <article key={leader.id}>
                  {leaderImageUrl ? (
                    <img
                      src={leaderImageUrl}
                      alt={leader.name || leader.position || 'Leader'}
                    />
                  ) : (
                    <div role="img" aria-label="Leader placeholder">
                      No image
                    </div>
                  )}
                  <p>
                    <strong>{leader.position}</strong>
                  </p>
                  {leader.title && <p>{leader.title}</p>}
                  {leader.name && <p>{leader.name}</p>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2>Past Leaders</h2>
        {(item?.leaders?.past || EMPTY_LEADERS.past).length === 0 ? (
          <p>No past leaders listed.</p>
        ) : (
          <div>
            {(item?.leaders?.past || EMPTY_LEADERS.past).map((leader) => {
              const leaderImage =
                leader?.images?.medium ||
                leader?.images?.large ||
                leader?.images?.thumbnail ||
                leader?.images?.original ||
                ''
              const leaderImageUrl = leaderImage
                ? resolveAssetUrl(leaderImage)
                : ''

              return (
                <article key={leader.id}>
                  {leaderImageUrl ? (
                    <img
                      src={leaderImageUrl}
                      alt={leader.name || leader.position || 'Leader'}
                    />
                  ) : (
                    <div role="img" aria-label="Leader placeholder">
                      No image
                    </div>
                  )}
                  <p>
                    <strong>{leader.position}</strong>
                  </p>
                  {leader.title && <p>{leader.title}</p>}
                  {leader.name && <p>{leader.name}</p>}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

export default ClanDetail
