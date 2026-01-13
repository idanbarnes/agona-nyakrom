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
