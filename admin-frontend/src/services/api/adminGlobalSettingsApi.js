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

export async function getGlobalSettings() {
  const response = await fetch(buildApiUrl('/api/admin/global-settings'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function saveGlobalSettings(payloadOrFormData) {
  const isFormData =
    typeof FormData !== 'undefined' && payloadOrFormData instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildApiUrl('/api/admin/global-settings'), {
    method: 'PUT',
    headers,
    body: isFormData ? payloadOrFormData : JSON.stringify(payloadOrFormData),
  })

  return parseJsonResponse(response)
}
