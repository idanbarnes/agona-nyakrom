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

export async function getAllLandmarks(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.page !== undefined) {
    searchParams.set('page', params.page)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit)
  }

  const query = searchParams.toString()
  const url = buildApiUrl(`/api/admin/landmarks${query ? `?${query}` : ''}`)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function getSingleLandmark(id) {
  const response = await fetch(buildApiUrl(`/api/admin/landmarks/${id}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function createLandmark(formData) {
  const response = await fetch(buildApiUrl('/api/admin/landmarks'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function updateLandmark(id, formData) {
  const response = await fetch(buildApiUrl(`/api/admin/landmarks/${id}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function deleteLandmark(id) {
  const response = await fetch(buildApiUrl(`/api/admin/landmarks/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}
