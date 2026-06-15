import { getAuthToken } from '../../lib/auth.js'
import { buildApiUrl } from '../../lib/apiBase.js'


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

  return payload
}

export async function getAllNews(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.page !== undefined) {
    searchParams.set('page', params.page)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit)
  }
  if (params.search !== undefined && String(params.search).trim() !== '') {
    searchParams.set('search', String(params.search).trim())
  }
  if (params.status !== undefined && String(params.status).trim() !== '') {
    searchParams.set('status', String(params.status).trim())
  }

  const query = searchParams.toString()
  const url = buildApiUrl(`/api/admin/news/all${query ? `?${query}` : ''}`)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function getSingleNews(id) {
  const response = await fetch(buildApiUrl(`/api/admin/news/single/${id}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function getNewsPreviewUrl(id) {
  const response = await fetch(buildApiUrl(`/api/admin/news/${id}/preview`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function createNews(formData) {
  const response = await fetch(buildApiUrl('/api/admin/news/create'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function updateNews(id, formData) {
  const response = await fetch(buildApiUrl(`/api/admin/news/update/${id}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function deleteNews(id) {
  const response = await fetch(buildApiUrl(`/api/admin/news/delete/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}
