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

export async function getAllAsafoCompanies(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.page !== undefined) {
    searchParams.set('page', params.page)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit)
  }

  const query = searchParams.toString()
  const url = buildUrl(
    `/api/admin/asafo-companies/all${query ? `?${query}` : ''}`
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

export async function getSingleAsafoCompany(id) {
  const response = await fetch(
    buildUrl(`/api/admin/asafo-companies/single/${id}`),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...buildAuthHeaders(),
      },
    }
  )

  return parseJsonResponse(response)
}

export async function createAsafoCompany(formData) {
  const response = await fetch(buildUrl('/api/admin/asafo-companies/create'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
    },
    body: formData,
  })

  return parseJsonResponse(response)
}

export async function updateAsafoCompany(id, formData) {
  const response = await fetch(
    buildUrl(`/api/admin/asafo-companies/update/${id}`),
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        ...buildAuthHeaders(),
      },
      body: formData,
    }
  )

  return parseJsonResponse(response)
}

export async function deleteAsafoCompany(id) {
  const response = await fetch(
    buildUrl(`/api/admin/asafo-companies/delete/${id}`),
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
