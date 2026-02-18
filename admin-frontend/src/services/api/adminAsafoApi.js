import { getAuthToken } from '../../lib/auth.js'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')

const buildUrl = (path) => `${API_BASE_URL}${path}`
const authHeaders = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const parse = async (response) => {
  const payload = await response.json()
  if (!response.ok) {
    const err = new Error(payload?.message || 'Request failed')
    err.status = response.status
    throw err
  }
  return payload
}

export const getAllAsafoCompanies = async () => {
  const response = await fetch(buildUrl('/api/admin/asafo'), {
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  return parse(response)
}

export const getSingleAsafoCompany = async (id) => {
  const response = await fetch(buildUrl(`/api/admin/asafo/${id}`), {
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  return parse(response)
}

export const createAsafoCompany = async (formData) => {
  const response = await fetch(buildUrl('/api/admin/asafo'), {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  })
  return parse(response)
}

export const updateAsafoCompany = async (id, formData) => {
  const response = await fetch(buildUrl(`/api/admin/asafo/${id}`), {
    method: 'PUT',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  })
  return parse(response)
}

export const deleteAsafoCompany = async (id) => {
  const response = await fetch(buildUrl(`/api/admin/asafo/${id}`), {
    method: 'DELETE',
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  return parse(response)
}

export const uploadAsafoInlineImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  const response = await fetch(buildUrl('/api/admin/asafo/upload-image'), {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  })
  return parse(response)
}
