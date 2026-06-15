const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).trim()

export function buildApiUrl(path) {
  if (!API_BASE_URL) {
    return path
  }

  const base = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${base}${normalizedPath}`
}

export function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  const rawPath = String(path).trim()
  if (/^https?:\/\//i.test(rawPath) || rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
    return rawPath
  }

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  return API_BASE_URL ? buildApiUrl(normalizedPath) : normalizedPath
}

export { API_BASE_URL }
export default API_BASE_URL
