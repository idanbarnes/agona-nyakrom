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

export const getAboutPage = async (slug) => {
  const response = await fetch(buildUrl(`/api/admin/about-pages/${slug}`), {
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  return parse(response)
}

export const saveAboutPage = async (slug, body) => {
  const response = await fetch(buildUrl(`/api/admin/about-pages/${slug}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  })
  return parse(response)
}

export const uploadAboutInlineImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  const response = await fetch(buildUrl('/api/admin/about-pages/upload-image'), {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  })
  return parse(response)
}

export const listLeaders = async (category) => {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  const response = await fetch(buildUrl(`/api/admin/leaders${query}`), {
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  return parse(response)
}

export const createLeader = async (formData) => {
  const response = await fetch(buildUrl('/api/admin/leaders'), {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  })
  return parse(response)
}

export const updateLeader = async (id, formData) => {
  const response = await fetch(buildUrl(`/api/admin/leaders/${id}`), {
    method: 'PUT',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  })
  return parse(response)
}

export const deleteLeader = async (id) => {
  const response = await fetch(buildUrl(`/api/admin/leaders/${id}`), {
    method: 'DELETE',
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  return parse(response)
}
