import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAsafoDetail } from '../../api/endpoints.js'
import { resolveAssetUrl } from '../../lib/apiBase.js'

function AsafoDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadCompany = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getAsafoDetail(slug)
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
      loadCompany()
    } else {
      setLoading(false)
      setError(new Error('Missing asafo company slug.'))
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
      <section className="container space-y-4 py-6 md:py-10">
        <h1 className="text-2xl font-semibold text-foreground break-words md:text-4xl">
          Asafo Company
        </h1>
        <p className="text-sm text-muted-foreground">
          Loading asafo company...
        </p>
      </section>
    )
  }

  if (error) {
    const notFound = error?.status === 404
    return (
      <section className="container space-y-4 py-6 md:py-10">
        <h1 className="text-2xl font-semibold text-foreground break-words md:text-4xl">
          Asafo Company
        </h1>
        {notFound ? (
          <>
            <p className="text-sm text-muted-foreground">
              Sorry, that asafo company was not found.
            </p>
            <p className="text-sm text-muted-foreground">
              <Link to="/asafo-companies">Back to asafo companies</Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Unable to load this asafo company.
            </p>
            <pre className="text-sm text-muted-foreground">
              {error?.message || String(error)}
            </pre>
          </>
        )}
      </section>
    )
  }

  return (
    <section className="container space-y-6 py-6 md:py-10">
      <h1 className="text-2xl font-semibold text-foreground break-words md:text-4xl">
        {item?.name || 'Asafo Company'}
      </h1>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={item?.name || 'Asafo company'}
          className="h-56 w-full rounded-xl border border-border object-cover md:h-80"
        />
      )}
      {item?.history ? (
        <p className="leading-7 text-foreground">{item.history}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No history available.</p>
      )}
      {item?.description && (
        <p className="leading-7 text-foreground">{item.description}</p>
      )}
      {item?.events ? (
        <p className="leading-7 text-foreground">{item.events}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No events listed.</p>
      )}
    </section>
  )
}

export default AsafoDetail
