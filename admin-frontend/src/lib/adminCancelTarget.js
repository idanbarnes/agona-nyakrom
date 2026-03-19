import { matchPath } from 'react-router-dom'

const DASHBOARD_PATH = '/dashboard'

const LIST_BACKED_CANCEL_ROUTES = [
  { pattern: '/admin/news/create', target: '/admin/news' },
  { pattern: '/admin/news/edit/:id', target: '/admin/news' },
  { pattern: '/admin/obituaries/create', target: '/admin/obituaries' },
  { pattern: '/admin/obituaries/edit/:id', target: '/admin/obituaries' },
  { pattern: '/admin/clans/create', target: '/admin/clans' },
  { pattern: '/admin/clans/edit/:id', target: '/admin/clans' },
  { pattern: '/admin/asafo-companies/section/:sectionId', target: '/admin/asafo-companies' },
  { pattern: '/admin/hall-of-fame/create', target: '/admin/hall-of-fame' },
  { pattern: '/admin/hall-of-fame/edit/:id', target: '/admin/hall-of-fame' },
  { pattern: '/admin/homepage-sections/create', target: '/admin/homepage-sections' },
  { pattern: '/admin/homepage-sections/edit/:id', target: '/admin/homepage-sections' },
  { pattern: '/admin/landmarks/create', target: '/admin/landmarks' },
  { pattern: '/admin/landmarks/edit/:id', target: '/admin/landmarks' },
  { pattern: '/admin/carousel/create', target: '/admin/carousel' },
  { pattern: '/admin/carousel/edit/:id', target: '/admin/carousel' },
  { pattern: '/admin/events/new', target: '/admin/events' },
  { pattern: '/admin/events/:id/edit', target: '/admin/events' },
  { pattern: '/admin/announcements/new', target: '/admin/announcements' },
  { pattern: '/admin/announcements/:id/edit', target: '/admin/announcements' },
]

const STANDALONE_CANCEL_ROUTES = [
  '/admin/global-settings',
  '/admin/contact',
  '/admin/faqs',
  '/admin/history',
  '/admin/about-nyakrom/history',
  '/admin/about-nyakrom/who-we-are',
  '/admin/about-nyakrom/about-agona-nyakrom-town',
  '/admin/about-nyakrom/leadership-governance',
]

export function hasListBackedCancelTarget(pathname = '') {
  const normalizedPath = String(pathname || '').trim()
  return LIST_BACKED_CANCEL_ROUTES.some(({ pattern }) => matchPath(pattern, normalizedPath))
}

export function resolveAdminCancelTarget(pathname = '', fallback = DASHBOARD_PATH) {
  const normalizedPath = String(pathname || '').trim()
  if (!normalizedPath) {
    return fallback
  }

  const matchedListRoute = LIST_BACKED_CANCEL_ROUTES.find(({ pattern }) =>
    matchPath(pattern, normalizedPath)
  )
  if (matchedListRoute) {
    return matchedListRoute.target
  }

  if (STANDALONE_CANCEL_ROUTES.some((pattern) => matchPath(pattern, normalizedPath))) {
    return DASHBOARD_PATH
  }

  return fallback
}

export { DASHBOARD_PATH }
