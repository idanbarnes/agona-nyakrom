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

function isFormDataPayload(payloadOrFormData) {
  return typeof FormData !== 'undefined' && payloadOrFormData instanceof FormData
}

export async function getAllSections(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.page !== undefined) {
    searchParams.set('page', params.page)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit)
  }

  const query = searchParams.toString()
  const url = buildApiUrl(
    `/api/admin/homepage-sections${query ? `?${query}` : ''}`
  )
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function getSingleSection(id) {
  const response = await fetch(buildApiUrl(`/api/admin/homepage-sections/${id}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function createSection(payloadOrFormData) {
  const isFormData = isFormDataPayload(payloadOrFormData)
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildApiUrl('/api/admin/homepage-sections'), {
    method: 'POST',
    headers,
    body: isFormData ? payloadOrFormData : JSON.stringify(payloadOrFormData),
  })

  return parseJsonResponse(response)
}

export async function updateSection(id, payloadOrFormData) {
  const isFormData = isFormDataPayload(payloadOrFormData)
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildApiUrl(`/api/admin/homepage-sections/${id}`), {
    method: 'PUT',
    headers,
    body: isFormData ? payloadOrFormData : JSON.stringify(payloadOrFormData),
  })

  return parseJsonResponse(response)
}

export async function deleteSection(id) {
  const response = await fetch(buildApiUrl(`/api/admin/homepage-sections/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}
