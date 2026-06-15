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

export async function getAllBlocks() {
  const response = await fetch(buildApiUrl('/api/admin/homepage-blocks'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function getSingleBlock(id) {
  const response = await fetch(buildApiUrl(`/api/admin/homepage-blocks/${id}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function createBlock(payload) {
  const isFormData = isFormDataPayload(payload)
  const response = await fetch(buildApiUrl('/api/admin/homepage-blocks'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: isFormData ? payload : JSON.stringify(payload),
  })

  return parseJsonResponse(response)
}

export async function updateBlock(id, payload) {
  const isFormData = isFormDataPayload(payload)
  const response = await fetch(buildApiUrl(`/api/admin/homepage-blocks/${id}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: isFormData ? payload : JSON.stringify(payload),
  })

  return parseJsonResponse(response)
}

export async function deleteBlock(id) {
  const response = await fetch(buildApiUrl(`/api/admin/homepage-blocks/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}
