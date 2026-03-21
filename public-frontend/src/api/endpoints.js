import { request } from './http.js'
import { appendPreviewToken } from '../lib/preview.js'

const LONG_LIVED_PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000
const STANDARD_PUBLIC_CACHE_TTL_MS = 60 * 1000

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

function requestSharedPublicData(path, cacheTtlMs = STANDARD_PUBLIC_CACHE_TTL_MS) {
  return request(path, {
    useSharedCache: true,
    cacheTtlMs,
  })
}

// Public content endpoints.
export const getGlobalSettings = () =>
  requestSharedPublicData(
    '/api/public/global-settings',
    LONG_LIVED_PUBLIC_CACHE_TTL_MS,
  )
export const getContactInfo = () => requestSharedPublicData('/api/public/contact')
export const getContactFaqs = () => requestSharedPublicData('/api/public/faqs')
export const getContactSections = () =>
  requestSharedPublicData('/api/public/contact/sections')

export const getHomepage = () => requestSharedPublicData('/api/public/homepage')

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
export const getClans = (params = {}) => {
  const query = new URLSearchParams()
  if (params.featured === true) {
    query.set('featured', 'true')
  }

  const queryString = query.toString()
  return request(`/api/public/clans${queryString ? `?${queryString}` : ''}`)
}

export const getClanDetail = (slug) =>
  request(appendPreviewToken(`/api/public/clans/${slug}`))

// Asafo entries endpoints.
export const getAsafoCompanies = () =>
  requestSharedPublicData('/api/public/asafo')

export const getAsafoDetail = (slug) =>
  request(appendPreviewToken(`/api/public/asafo/${slug}`))

// Hall of Fame endpoints.
export const getHallOfFame = () =>
  requestSharedPublicData('/api/public/hall-of-fame')

export const getHallOfFameDetail = (slug) =>
  request(appendPreviewToken(`/api/public/hall-of-fame/${slug}`))

// Landmarks endpoints.
export const getLandmarks = (pagination) =>
  request(withPagination('/api/public/landmarks', pagination))

export const getLandmarkDetail = (slug) =>
  request(appendPreviewToken(`/api/public/landmarks/${slug}`))

// Carousel endpoints.
export const getCarousel = () =>
  requestSharedPublicData(appendPreviewToken('/api/public/carousel'))

// History endpoints.
export const getHistory = () => requestSharedPublicData('/api/public/history')
export const getAboutPageBySlug = (slug) =>
  requestSharedPublicData(appendPreviewToken(`/api/public/about/${slug}`))
export const getPublicLeaders = () => requestSharedPublicData('/api/public/leaders')
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
