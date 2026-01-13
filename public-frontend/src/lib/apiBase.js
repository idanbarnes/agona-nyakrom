// Default to proxy-friendly relative base, allow override for direct backend access.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Use a concrete origin for assets when the API base is relative (proxy mode).
const API_ASSET_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = API_ASSET_BASE_URL.replace(/\/$/, '')
  return `${base}${normalizedPath}`
}

export { API_BASE_URL, API_ASSET_BASE_URL, resolveAssetUrl }
export default API_BASE_URL
