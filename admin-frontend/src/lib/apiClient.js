import { getAuthToken } from './auth.js'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')

const unauthorizedListeners = new Set()
let isFetchInterceptorInstalled = false
let originalFetch = null

function buildUrl(path) {
  if (!API_BASE_URL) {
    return path
  }

  const base = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${base}${normalizedPath}`
}

export function buildApiUrl(path) {
  return buildUrl(path)
}

function isSessionManagedRequest(input, init = {}) {
  const requestUrl =
    typeof input === 'string'
      ? input
      : input?.url || ''

  if (!requestUrl) {
    return false
  }

  const normalizedUrl = String(requestUrl).toLowerCase()
  if (normalizedUrl.includes('/api/admin/auth/login')) {
    return false
  }

  const isAdminUrl =
    normalizedUrl.includes('/api/admin') || normalizedUrl.includes('/api/faqs')
  if (!isAdminUrl) {
    return false
  }

  const method =
    String(
      init?.method ||
        (typeof input !== 'string' ? input?.method : 'GET') ||
        'GET',
    ).toUpperCase()

  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
}

function notifyUnauthorized(details = {}) {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener(details)
    } catch {
      // Listener failures must not block request handling.
    }
  })
}

export function onApiUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

export function installApiFetchInterceptor() {
  if (isFetchInterceptorInstalled || typeof window === 'undefined') {
    return () => {}
  }

  if (typeof window.fetch !== 'function') {
    return () => {}
  }

  originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init)
    if (response?.status === 401 && isSessionManagedRequest(input, init)) {
      notifyUnauthorized({
        status: 401,
        url:
          typeof input === 'string'
            ? input
            : input?.url || '',
      })
    }
    return response
  }

  isFetchInterceptorInstalled = true

  return () => {
    if (!isFetchInterceptorInstalled || !originalFetch) {
      return
    }
    window.fetch = originalFetch
    originalFetch = null
    isFetchInterceptorInstalled = false
  }
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body } = options
  const headers = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getAuthToken()
  if (token) {
    // Attach the auth token for admin endpoints when available.
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    // Network or CORS failure.
    throw new Error('Unable to reach the server. Please try again.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    // Normalize non-JSON responses into a readable error.
    throw new Error('Unexpected server response.')
  }

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.message || 'Request failed.')
    error.status = response.status
    throw error
  }

  return payload.data
}

export function postJson(path, body) {
  return apiRequest(path, { method: 'POST', body })
}

export async function apiRequestFormData(path, formData, options = {}) {
  const { method = 'POST' } = options
  const headers = {
    Accept: 'application/json',
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: formData,
    })
  } catch {
    throw new Error('Unable to reach the server. Please try again.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('Unexpected server response.')
  }

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.message || 'Request failed.')
    error.status = response.status
    throw error
  }

  return payload.data ?? payload
}
