import { getAuthToken } from '../../lib/auth.js'

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

function buildAuthHeaders() {
  const token = getAuthToken()
  if (!token) {
    return {}
  }

  return { Authorization: `Bearer ${token}` }
}

async function parseJsonResponse(response) {
  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('Unexpected server response.')
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed.')
    error.status = response.status
    throw error
  }

  if (!payload?.success) {
    const error = new Error(payload?.message || 'Request failed.')
    error.status = response.status
    throw error
  }

  return payload
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  return parseJsonResponse(response)
}

export function getAdminContact() {
  return requestJson('/api/admin/contact')
}

export function updateAdminContact(payload) {
  return requestJson('/api/admin/contact', {
    method: 'PUT',
    body: payload,
  })
}

export function listAdminFaqs(params = {}) {
  const query = new URLSearchParams()
  if (params.page !== undefined) {
    query.set('page', params.page)
  }
  if (params.limit !== undefined) {
    query.set('limit', params.limit)
  }
  if (params.search !== undefined && String(params.search).trim() !== '') {
    query.set('search', String(params.search).trim())
  }
  if (params.status !== undefined && String(params.status).trim() !== '') {
    query.set('status', String(params.status).trim())
  }

  const queryString = query.toString()
  return requestJson(`/api/faqs/admin${queryString ? `?${queryString}` : ''}`)
}

export function createAdminFaq(payload) {
  return requestJson('/api/faqs', {
    method: 'POST',
    body: payload,
  })
}

export function getAdminFaq(id) {
  return requestJson(`/api/faqs/${id}`)
}

export function updateAdminFaq(id, payload) {
  return requestJson(`/api/faqs/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteAdminFaq(id) {
  return requestJson(`/api/faqs/${id}`, {
    method: 'DELETE',
  })
}

export function toggleAdminFaq(id) {
  return requestJson(`/api/faqs/${id}/toggle`, {
    method: 'PATCH',
  })
}

export function reorderAdminFaqs(items) {
  return requestJson('/api/faqs/reorder', {
    method: 'PATCH',
    body: { items },
  })
}

export function bulkAdminFaqAction(action, ids) {
  const normalizedAction = String(action || '').trim().toLowerCase()
  if (normalizedAction === 'delete') {
    return requestJson('/api/faqs/bulk-delete', {
      method: 'POST',
      body: { ids },
    })
  }
  if (normalizedAction === 'activate') {
    return requestJson('/api/faqs/bulk-activate', {
      method: 'POST',
      body: { ids },
    })
  }
  if (normalizedAction === 'deactivate') {
    return requestJson('/api/faqs/bulk-deactivate', {
      method: 'POST',
      body: { ids },
    })
  }

  return requestJson('/api/admin/faqs/bulk', {
    method: 'POST',
    body: { action, ids },
  })
}
