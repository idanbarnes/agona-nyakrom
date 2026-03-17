// Default to backend origin in development, allow explicit override for deployments.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).trim()

const LOOPBACK_HOST_PATTERN = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|::1)$/i

function isLoopbackUrl(value) {
  try {
    const parsed = new URL(value)
    return LOOPBACK_HOST_PATTERN.test(parsed.hostname)
  } catch {
    return false
  }
}

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  const rawPath = String(path).trim()

  if (/^(data:image\/|blob:)/i.test(rawPath)) {
    return rawPath
  }

  if (/^\/\//.test(rawPath)) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${rawPath}`
    }
    return `https:${rawPath}`
  }

  if (/^https?:\/\//i.test(rawPath)) {
    if (!isLoopbackUrl(rawPath)) {
      return rawPath
    }

    try {
      const parsed = new URL(rawPath)
      const rewrittenPath = `${parsed.pathname || ''}${parsed.search || ''}${parsed.hash || ''}`
      return resolveAssetUrl(rewrittenPath)
    } catch {
      return rawPath
    }
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
