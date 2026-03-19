import API_BASE_URL from '../lib/apiBase.js'

const sharedResponseCache = new Map()
const inFlightRequestCache = new Map()

// Base URL can be overridden via Vite env; default uses relative paths for proxy mode.

// Join base and path safely, handling leading/trailing slashes.
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

function normalizeRequestMethod(method) {
  return String(method || 'GET').trim().toUpperCase()
}

function hasPreviewToken(path) {
  try {
    const parsed = new URL(path, 'http://cache.local')
    return parsed.searchParams.has('preview_token')
  } catch {
    return false
  }
}

function getSharedCacheKey(method, path, cacheKey) {
  return cacheKey || `${method}:${path}`
}

function getFreshSharedResponse(cacheKey, cacheTtlMs) {
  if (!cacheKey || !(cacheTtlMs > 0)) {
    return null
  }

  const cached = sharedResponseCache.get(cacheKey)
  if (!cached) {
    return null
  }

  if (Date.now() - cached.timestamp >= cacheTtlMs) {
    sharedResponseCache.delete(cacheKey)
    return null
  }

  return cached.data
}

function setFreshSharedResponse(cacheKey, data) {
  if (!cacheKey) {
    return
  }

  sharedResponseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  })
}

// Parse response body, preferring JSON but falling back to text when available.
async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text ? { message: text } : null
  } catch {
    return null
  }
}

async function executeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await parseResponseBody(response)

  if (!response.ok || (data && data.success === false)) {
    const message =
      (data && (data.error || data.message)) ||
      response.statusText ||
      'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// Generic request wrapper that normalizes JSON handling and error semantics.
export async function request(path, options = {}) {
  const {
    useSharedCache = false,
    cacheTtlMs = 0,
    cacheKey,
    forceRefresh = false,
    ...fetchOptions
  } = options
  const url = joinUrl(API_BASE_URL, path)
  const method = normalizeRequestMethod(fetchOptions.method)
  const canUseSharedCache =
    useSharedCache &&
    method === 'GET' &&
    cacheTtlMs > 0 &&
    !hasPreviewToken(path)

  if (!canUseSharedCache) {
    return executeRequest(url, fetchOptions)
  }

  const resolvedCacheKey = getSharedCacheKey(method, path, cacheKey)

  if (!forceRefresh) {
    const cachedResponse = getFreshSharedResponse(resolvedCacheKey, cacheTtlMs)
    if (cachedResponse !== null) {
      return cachedResponse
    }

    const inFlightRequest = inFlightRequestCache.get(resolvedCacheKey)
    if (inFlightRequest) {
      return inFlightRequest
    }
  }

  const inFlightRequest = executeRequest(url, fetchOptions)
    .then((data) => {
      setFreshSharedResponse(resolvedCacheKey, data)
      return data
    })
    .finally(() => {
      inFlightRequestCache.delete(resolvedCacheKey)
    })

  inFlightRequestCache.set(resolvedCacheKey, inFlightRequest)
  return inFlightRequest
}

export function clearSharedRequestCache(cacheKey = '') {
  if (!cacheKey) {
    sharedResponseCache.clear()
    inFlightRequestCache.clear()
    return
  }

  sharedResponseCache.delete(cacheKey)
  inFlightRequestCache.delete(cacheKey)
}
