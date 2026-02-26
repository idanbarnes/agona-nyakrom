import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { clearAuthToken } from '../lib/auth.js'
import { apiRequest } from '../lib/apiClient.js'
import { normalizePreviewResource } from '../lib/adminPreview.js'
import { resolvePreviewTargetUrl } from '../lib/previewTargetUrl.js'
import { Button } from '../components/ui/button.jsx'

function AdminPreviewRedirectPage() {
  const navigate = useNavigate()
  const { resource, id } = useParams()
  const [errorMessage, setErrorMessage] = useState('')

  const normalizedResource = useMemo(
    () => normalizePreviewResource(resource),
    [resource],
  )

  useEffect(() => {
    let isMounted = true

    const loadPreview = async () => {
      if (!normalizedResource || !id) {
        setErrorMessage('Invalid preview URL.')
        return
      }

      try {
        const payload = await apiRequest(
          `/api/admin/${normalizedResource}/${encodeURIComponent(id)}/preview`,
        )
        const targetUrl = resolvePreviewTargetUrl(payload)

        if (!targetUrl) {
          throw new Error('Preview URL was not returned by the server.')
        }

        window.location.replace(targetUrl)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error.status === 401) {
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }

        setErrorMessage(error.message || 'Unable to open preview.')
      }
    }

    loadPreview()

    return () => {
      isMounted = false
    }
  }, [id, navigate, normalizedResource])

  if (errorMessage) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Preview unavailable</h1>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <Button as={Link} to="/dashboard" variant="secondary">
          Back to dashboard
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold text-foreground">Preparing preview...</h1>
      <p className="text-sm text-muted-foreground">
        Your preview is being generated in this tab.
      </p>
    </section>
  )
}

export default AdminPreviewRedirectPage
