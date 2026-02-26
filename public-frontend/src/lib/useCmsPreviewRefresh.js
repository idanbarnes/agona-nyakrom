import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

function useCmsPreviewRefresh(onRefresh, options = {}) {
  const location = useLocation()
  const enabled = options.enabled ?? true

  const hasPreviewToken = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    const previewToken = String(searchParams.get('preview_token') || '').trim()
    return Boolean(previewToken)
  }, [location.search])

  useEffect(() => {
    if (!enabled || !hasPreviewToken || typeof onRefresh !== 'function') {
      return undefined
    }

    const handlePreviewRefresh = (event) => {
      if (typeof event?.preventDefault === 'function') {
        event.preventDefault()
      }

      void onRefresh()
    }

    window.addEventListener('cms-preview-refresh', handlePreviewRefresh)
    return () => {
      window.removeEventListener('cms-preview-refresh', handlePreviewRefresh)
    }
  }, [enabled, hasPreviewToken, onRefresh])
}

export default useCmsPreviewRefresh
