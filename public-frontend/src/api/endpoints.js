import { request } from './http.js'
import { appendPreviewToken } from '../lib/preview.js'

// Build a query string for pagination when values are provided.
function withPagination(path, { page, limit } = {}) {
  const params = new URLSearchParams()

  if (page !== undefined && page !== null) {
    params.set('page', page)
  }

  if (limit !== undefined && limit !== null) {
    params.set('limit', limit)
  }

  const query = params.toString()
  return query ? `${path}?${query}` : path
}

// Public content endpoints.
export const getGlobalSettings = () =>
  request('/api/public/global-settings')
export const getContactInfo = () => request('/api/public/contact')
export const getContactFaqs = () => request('/api/public/faqs')
export const getContactSections = () => request('/api/public/contact/sections')

export const getHomepage = () => request('/api/public/homepage')

// News endpoints.
export const getNews = (pagination) =>
  request(withPagination('/api/public/news', pagination))

export const getNewsDetail = (slug) =>
  request(appendPreviewToken(`/api/public/news/${slug}`))

export const getNewsPreview = (slug, token) => {
  const query = new URLSearchParams()
  query.set('slug', String(slug || '').trim())
  query.set('token', String(token || '').trim())

  return request(`/api/public/news/preview?${query.toString()}`)
}

// Obituaries endpoints.
export const getObituaries = (pagination) =>
  request(withPagination('/api/public/obituaries', pagination))

export const getObituaryDetail = (slug) =>
  request(appendPreviewToken(`/api/public/obituaries/${slug}`))

// Clans endpoints.
export const getClans = () => request('/api/public/clans')

export const getClanDetail = (slug) =>
  request(appendPreviewToken(`/api/public/clans/${slug}`))

// Asafo entries endpoints.
export const getAsafoCompanies = () =>
  request('/api/public/asafo')

export const getAsafoDetail = (slug) =>
  request(appendPreviewToken(`/api/public/asafo/${slug}`))

// Hall of Fame endpoints.
export const getHallOfFame = () => request('/api/public/hall-of-fame')

export const getHallOfFameDetail = (slug) =>
  request(appendPreviewToken(`/api/public/hall-of-fame/${slug}`))

// Landmarks endpoints.
export const getLandmarks = (pagination) =>
  request(withPagination('/api/public/landmarks', pagination))

export const getLandmarkDetail = (slug) =>
  request(appendPreviewToken(`/api/public/landmarks/${slug}`))

// Carousel endpoints.
export const getCarousel = () => request('/api/public/carousel')

// History endpoints.
export const getHistory = () => request('/api/public/history')
export const getAboutPageBySlug = (slug) =>
  request(appendPreviewToken(`/api/public/about/${slug}`))
export const getPublicLeaders = () => request('/api/public/leaders')
export const getPublicLeaderBySlug = (slug) =>
  request(appendPreviewToken(`/api/public/leaders/${slug}`))

// Announcements & Events endpoints.
export const getAnnouncementsEvents = (params = {}) => {
  const query = new URLSearchParams()
  if (params.events_limit !== undefined) {
    query.set('events_limit', params.events_limit)
  }
  if (params.coming_soon_limit !== undefined) {
    query.set('coming_soon_limit', params.coming_soon_limit)
  }
  if (params.upcoming_limit !== undefined) {
    query.set('upcoming_limit', params.upcoming_limit)
  }
  if (params.past_limit !== undefined) {
    query.set('past_limit', params.past_limit)
  }
  if (params.announcements_limit !== undefined) {
    query.set('announcements_limit', params.announcements_limit)
  }

  const queryString = query.toString()
  return request(
    `/api/public/announcements-events${queryString ? `?${queryString}` : ''}`,
  )
}

export const getPublicEvents = (params = {}) => {
  const query = new URLSearchParams()
  if (params.state !== undefined) {
    query.set('state', params.state)
  }
  if (params.page !== undefined) {
    query.set('page', params.page)
  }
  if (params.limit !== undefined) {
    query.set('limit', params.limit)
  }

  const queryString = query.toString()
  return request(`/api/public/events${queryString ? `?${queryString}` : ''}`)
}

export const getPublicEventDetail = (slug) =>
  request(appendPreviewToken(`/api/public/events/${slug}`))

export const getPublicAnnouncements = (params = {}) => {
  const query = new URLSearchParams()
  if (params.page !== undefined) {
    query.set('page', params.page)
  }
  if (params.limit !== undefined) {
    query.set('limit', params.limit)
  }

  const queryString = query.toString()
  return request(
    `/api/public/announcements${queryString ? `?${queryString}` : ''}`,
  )
}

export const getPublicAnnouncementDetail = (slug) =>
  request(appendPreviewToken(`/api/public/announcements/${slug}`))
