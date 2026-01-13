import { getAuthToken } from './auth.js'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')

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
  } catch (error) {
    // Network or CORS failure.
    throw new Error('Unable to reach the server. Please try again.')
  }

  let payload
  try {
    payload = await response.json()
  } catch (error) {
    // Normalize non-JSON responses into a readable error.
    throw new Error('Unexpected server response.')
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed.')
  }

  return payload.data
}

export function postJson(path, body) {
  return apiRequest(path, { method: 'POST', body })
}
