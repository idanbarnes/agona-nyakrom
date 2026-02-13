// Default to backend origin in development, allow explicit override for deployments.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).trim()

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  const rawPath = String(path).trim()

  if (/^(https?:|data:image\/|blob:)/i.test(rawPath)) {
    return rawPath
  }

  if (/^\/\//.test(rawPath)) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${rawPath}`
    }
    return `https:${rawPath}`
  }

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const base = API_BASE_URL.replace(/\/$/, '')

  if (/^https?:\/\//i.test(base)) {
    return `${base}${normalizedPath}`
  }

  return normalizedPath
}

export { API_BASE_URL, resolveAssetUrl }
export default API_BASE_URL
