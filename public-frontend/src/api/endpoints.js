import { request } from './http.js'

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

export const getHomepage = () => request('/api/public/homepage')

// News endpoints.
export const getNews = (pagination) =>
  request(withPagination('/api/public/news', pagination))

export const getNewsDetail = (slug) =>
  request(`/api/public/news/${slug}`)

// Obituaries endpoints.
export const getObituaries = (pagination) =>
  request(withPagination('/api/public/obituaries', pagination))

export const getObituaryDetail = (slug) =>
  request(`/api/public/obituaries/${slug}`)

// Clans endpoints.
export const getClans = () => request('/api/public/clans')

export const getClanDetail = (slug) =>
  request(`/api/public/clans/${slug}`)

// Asafo companies endpoints.
export const getAsafoCompanies = () =>
  request('/api/public/asafo-companies')

export const getAsafoDetail = (slug) =>
  request(`/api/public/asafo-companies/${slug}`)

// Hall of Fame endpoints.
export const getHallOfFame = () => request('/api/public/hall-of-fame')

export const getHallOfFameDetail = (slug) =>
  request(`/api/public/hall-of-fame/${slug}`)

// Landmarks endpoints.
export const getLandmarks = (pagination) =>
  request(withPagination('/api/public/landmarks', pagination))

export const getLandmarkDetail = (slug) =>
  request(`/api/public/landmarks/${slug}`)

// Carousel endpoints.
export const getCarousel = () => request('/api/public/carousel')

// History endpoints.
export const getHistory = () => request('/api/public/history')
export const getAboutPageBySlug = (slug) => request(`/api/public/about/${slug}`)
export const getPublicLeaders = () => request('/api/public/leaders')
export const getPublicLeaderBySlug = (slug) => request(`/api/public/leaders/${slug}`)

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
  request(`/api/public/events/${slug}`)

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
  request(`/api/public/announcements/${slug}`)
