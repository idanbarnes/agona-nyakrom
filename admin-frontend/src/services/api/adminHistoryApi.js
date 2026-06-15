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

export async function getHistory() {
  const response = await fetch(buildApiUrl('/api/admin/history'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function saveHistory(formData) {
  const response = await fetch(buildApiUrl('/api/admin/history'), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}
