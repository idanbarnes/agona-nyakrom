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
  } catch (error) {
    throw new Error('Unexpected server response.')
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed.')
    error.status = response.status
    throw error
  }

  return payload
}

export async function getAllClans(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.page !== undefined) {
    searchParams.set('page', params.page)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit)
  }

  const query = searchParams.toString()
  const url = buildUrl(`/api/admin/clans/all${query ? `?${query}` : ''}`)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function getSingleClan(id) {
  const response = await fetch(buildUrl(`/api/admin/clans/single/${id}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function createClan(formData) {
  const response = await fetch(buildUrl('/api/admin/clans/create'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function updateClan(id, formData) {
  const response = await fetch(buildUrl(`/api/admin/clans/update/${id}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function deleteClan(id) {
  const response = await fetch(buildUrl(`/api/admin/clans/delete/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
  })

  return parseJsonResponse(response)
}

export async function createClanLeader(clanId, payloadOrFormData) {
  const isFormData =
    typeof FormData !== 'undefined' && payloadOrFormData instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(buildUrl(`/api/admin/clans/${clanId}/leaders`), {
    method: 'POST',
    headers,
    body: isFormData ? payloadOrFormData : JSON.stringify(payloadOrFormData),
  })

  return parseJsonResponse(response)
}

export async function updateClanLeader(clanId, leaderId, payloadOrFormData) {
  const isFormData =
    typeof FormData !== 'undefined' && payloadOrFormData instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...buildAuthHeaders(),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(
    buildUrl(`/api/admin/clans/${clanId}/leaders/${leaderId}`),
    {
      method: 'PUT',
      headers,
      body: isFormData ? payloadOrFormData : JSON.stringify(payloadOrFormData),
    }
  )

  return parseJsonResponse(response)
}

export async function deleteClanLeader(clanId, leaderId) {
  const response = await fetch(
    buildUrl(`/api/admin/clans/${clanId}/leaders/${leaderId}`),
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...buildAuthHeaders(),
      },
    }
  )

  return parseJsonResponse(response)
}

export async function reorderClanLeaders(clanId, payload) {
  const response = await fetch(
    buildUrl(`/api/admin/clans/${clanId}/leaders/reorder`),
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(payload),
    }
  )

  return parseJsonResponse(response)
}
