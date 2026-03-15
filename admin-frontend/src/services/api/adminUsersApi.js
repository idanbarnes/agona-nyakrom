import { apiRequest, postJson } from '../../lib/apiClient.js'

export function getAdminUsers(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit))
  }

  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset))
  }

  const query = searchParams.toString()
  return apiRequest(`/api/admin/users${query ? `?${query}` : ''}`)
}

export function createAdminUser(payload) {
  return postJson('/api/admin/users', payload)
}

export function updateAdminUser(id, payload) {
  return apiRequest(`/api/admin/users/${id}`, { method: 'PUT', body: payload })
}

export function deleteAdminUser(id) {
  return apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' })
}
