const PREVIEW_TOKEN_QUERY_KEY = 'preview_token'

export function getPreviewTokenFromLocation() {
  if (typeof window === 'undefined') {
    return ''
  }

  const token = new URLSearchParams(window.location.search).get(
    PREVIEW_TOKEN_QUERY_KEY,
  )
  return String(token || '').trim()
}

export function appendPreviewToken(path) {
  const token = getPreviewTokenFromLocation()
  if (!token) {
    return path
  }

  const url = new URL(path, 'http://preview.local')
  url.searchParams.set(PREVIEW_TOKEN_QUERY_KEY, token)
  return `${url.pathname}${url.search}`
}
