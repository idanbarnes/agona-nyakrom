import API_BASE_URL from '../lib/apiBase.js'

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

// Generic request wrapper that normalizes JSON handling and error semantics.
export async function request(path, options = {}) {
  const url = joinUrl(API_BASE_URL, path)
  const response = await fetch(url, {
    ...options,
    headers: {
      // Default to JSON responses while allowing overrides.
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await parseResponseBody(response)

  // Treat non-2xx or explicit success: false as an error with rich context.
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
