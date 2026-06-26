const LOOPBACK_HOST_PATTERN = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|::1)$/i

function normalizeBase(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function normalizePath(path) {
  const value = String(path || '').trim()
  if (!value) {
    return '/'
  }

  return value.startsWith('/') ? value : `/${value}`
}

function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim())
}

function isLoopbackUrl(value) {
  try {
    const parsed = new URL(value)
    return LOOPBACK_HOST_PATTERN.test(parsed.hostname)
  } catch {
    return false
  }
}

function isLoopbackUploadUrl(value) {
  try {
    const parsed = new URL(value)
    return LOOPBACK_HOST_PATTERN.test(parsed.hostname) && parsed.pathname.startsWith('/uploads/')
  } catch {
    return false
  }
}

function getLoopbackAssetBaseUrl() {
  if (typeof window === 'undefined' || !window.location) {
    return ''
  }

  const { protocol, hostname, port } = window.location
  if (!LOOPBACK_HOST_PATTERN.test(hostname) || port === '5000') {
    return ''
  }

  return `${protocol || 'http:'}//localhost:5000`
}

function stripDuplicateApiPrefix(path) {
  const normalizedPath = normalizePath(path)

  if (normalizedPath === '/api') {
    return '/'
  }

  if (normalizedPath.startsWith('/api/')) {
    return normalizedPath.slice(4)
  }

  return normalizedPath
}

function shouldStripDuplicateApiPrefix(base) {
  if (!base) {
    return false
  }

  if (base === '/api') {
    return true
  }

  if (!isAbsoluteHttpUrl(base)) {
    return false
  }

  try {
    const parsed = new URL(base)
    return parsed.pathname.replace(/\/+$/, '') === '/api'
  } catch {
    return false
  }
}

function joinUrl(base, path) {
  if (!base) {
    return path
  }

  if (base.endsWith('/') && path.startsWith('/')) {
    return `${base}${path.slice(1)}`
  }

  if (!base.endsWith('/') && !path.startsWith('/')) {
    return `${base}/${path}`
  }

  return `${base}${path}`
}

export function getApiRuntimeConfig(env = {}) {
  const configuredBase = normalizeBase(env?.VITE_API_BASE_URL)
  const apiBaseUrl = configuredBase || (env?.DEV ? '' : '/api')

  if (!isAbsoluteHttpUrl(apiBaseUrl)) {
    return {
      apiBaseUrl,
      assetBaseUrl: env?.DEV && !configuredBase ? 'http://localhost:5000' : '',
      stripDuplicateApiPrefix: shouldStripDuplicateApiPrefix(apiBaseUrl),
    }
  }

  const parsed = new URL(apiBaseUrl)
  return {
    apiBaseUrl,
    assetBaseUrl: parsed.origin,
    stripDuplicateApiPrefix: shouldStripDuplicateApiPrefix(apiBaseUrl),
  }
}

export function buildApiUrlFromBase(apiBaseUrl, path, options = {}) {
  const requestedPath = normalizePath(path)

  if (requestedPath.startsWith('/uploads/')) {
    return options.assetBaseUrl ? joinUrl(options.assetBaseUrl, requestedPath) : requestedPath
  }

  const normalizedPath = options.stripDuplicateApiPrefix
    ? stripDuplicateApiPrefix(requestedPath)
    : requestedPath

  return joinUrl(apiBaseUrl, normalizedPath)
}

export function resolveAssetUrlFromBase(assetBaseUrl, path) {
  const rawPath = String(path || '').trim()
  if (!rawPath) {
    return ''
  }

  if (/^(data:image\/|blob:)/i.test(rawPath)) {
    return rawPath
  }

  if (/^\/\//.test(rawPath)) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${rawPath}`
    }
    return `https:${rawPath}`
  }

  if (isAbsoluteHttpUrl(rawPath)) {
    if (!isLoopbackUrl(rawPath)) {
      return rawPath
    }

    try {
      const parsed = new URL(rawPath)
      const rewrittenPath = `${parsed.pathname || ''}${parsed.search || ''}${parsed.hash || ''}`
      if (isLoopbackUploadUrl(rawPath)) {
        const loopbackAssetBaseUrl = getLoopbackAssetBaseUrl()
        if (loopbackAssetBaseUrl) {
          return joinUrl(loopbackAssetBaseUrl, rewrittenPath)
        }
      }
      return resolveAssetUrlFromBase(assetBaseUrl, rewrittenPath)
    } catch {
      return rawPath
    }
  }

  const normalizedPath = normalizePath(rawPath)
  if (!assetBaseUrl && normalizedPath.startsWith('/uploads/')) {
    const loopbackAssetBaseUrl = getLoopbackAssetBaseUrl()
    if (loopbackAssetBaseUrl) {
      return joinUrl(loopbackAssetBaseUrl, normalizedPath)
    }
  }

  return assetBaseUrl ? joinUrl(assetBaseUrl, normalizedPath) : normalizedPath
}

const runtimeConfig = getApiRuntimeConfig(import.meta.env)
const API_BASE_URL = runtimeConfig.apiBaseUrl

export function buildApiUrl(path) {
  return buildApiUrlFromBase(API_BASE_URL, path, runtimeConfig)
}

export function resolveAssetUrl(path) {
  return resolveAssetUrlFromBase(runtimeConfig.assetBaseUrl, path)
}

export { API_BASE_URL }
export default API_BASE_URL
