import { apiRequest, apiRequestFormData } from '../../lib/apiClient.js'

export async function listEvents(params = {}) {
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
  if (params.state) {
    searchParams.set('state', params.state)
  }
  if (params.date_from) {
    searchParams.set('date_from', params.date_from)
  }
  if (params.date_to) {
    searchParams.set('date_to', params.date_to)
  }
  if (params.tag) {
    searchParams.set('tag', params.tag)
  }

  const query = searchParams.toString()
  return apiRequest(`/api/admin/events${query ? `?${query}` : ''}`)
}

export function getEvent(id) {
  return apiRequest(`/api/admin/events/${id}`)
}

export function createEvent(formData) {
  return apiRequestFormData('/api/admin/events', formData, { method: 'POST' })
}

export function updateEvent(id, formData) {
  return apiRequestFormData(`/api/admin/events/${id}`, formData, { method: 'PUT' })
}

export function deleteEvent(id) {
  return apiRequest(`/api/admin/events/${id}`, { method: 'DELETE' })
}
