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

export async function getAllSlides(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.page !== undefined) {
    searchParams.set('page', params.page)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit)
  }

  const query = searchParams.toString()
  const baseHeaders = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }
  const primaryUrl = buildApiUrl(
    `/api/admin/carousel/all${query ? `?${query}` : ''}`
  )
  const fallbackUrl = buildApiUrl(
    `/api/admin/carousel${query ? `?${query}` : ''}`
  )

  const primaryResponse = await fetch(primaryUrl, {
    method: 'GET',
    headers: baseHeaders,
  })

  if (primaryResponse.status === 404) {
    const fallbackResponse = await fetch(fallbackUrl, {
      method: 'GET',
      headers: baseHeaders,
    })
    return parseJsonResponse(fallbackResponse)
  }

  return parseJsonResponse(primaryResponse)
}

export async function getSingleSlide(id) {
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }
  const primaryResponse = await fetch(
    buildApiUrl(`/api/admin/carousel/single/${id}`),
    {
      method: 'GET',
      headers,
    }
  )

  if (primaryResponse.status === 404) {
    const fallbackResponse = await fetch(buildApiUrl(`/api/admin/carousel/${id}`), {
      method: 'GET',
      headers,
    })
    return parseJsonResponse(fallbackResponse)
  }

  return parseJsonResponse(primaryResponse)
}

export async function createSlide(formData) {
  const response = await fetch(buildApiUrl('/api/admin/carousel/create'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function updateSlide(id, formData) {
  const response = await fetch(buildApiUrl(`/api/admin/carousel/update/${id}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function deleteSlide(id) {
  const response = await fetch(buildApiUrl(`/api/admin/carousel/delete/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}
