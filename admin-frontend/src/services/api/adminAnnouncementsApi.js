import { apiRequest, apiRequestFormData } from '../../lib/apiClient.js'

export async function listAnnouncements(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', params.page)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit)
  }
  if (params.search) {
    searchParams.set('search', params.search)
  }
  if (params.is_published !== undefined) {
    searchParams.set('is_published', params.is_published)
  }

  const query = searchParams.toString()
  return apiRequest(`/api/admin/announcements${query ? `?${query}` : ''}`)
}

export function getAnnouncement(id) {
  return apiRequest(`/api/admin/announcements/${id}`)
}

export function createAnnouncement(formData) {
  return apiRequestFormData('/api/admin/announcements', formData, {
    method: 'POST',
  })
}

export function updateAnnouncement(id, formData) {
  return apiRequestFormData(`/api/admin/announcements/${id}`, formData, {
    method: 'PUT',
  })
}

export function deleteAnnouncement(id) {
  return apiRequest(`/api/admin/announcements/${id}`, { method: 'DELETE' })
}
