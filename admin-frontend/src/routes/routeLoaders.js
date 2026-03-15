import { matchPath } from 'react-router-dom'

const routePreloadCache = new Set()

export const loadAdminNewsCreatePage = () => import('../pages/news/AdminNewsCreatePage.jsx')
export const loadAdminNewsEditPage = () => import('../pages/news/AdminNewsEditPage.jsx')
export const loadAdminNewsListPage = () => import('../pages/news/AdminNewsListPage.jsx')
export const loadAdminObituariesListPage = () =>
  import('../pages/obituaries/AdminObituariesListPage.jsx')
export const loadAdminObituariesCreatePage = () =>
  import('../pages/obituaries/AdminObituariesCreatePage.jsx')
export const loadAdminObituariesEditPage = () =>
  import('../pages/obituaries/AdminObituariesEditPage.jsx')
export const loadAdminClansListPage = () => import('../pages/clans/AdminClansListPage.jsx')
export const loadAdminClansCreatePage = () =>
  import('../pages/clans/AdminClansCreatePage.jsx')
export const loadAdminClansEditPage = () => import('../pages/clans/AdminClansEditPage.jsx')
export const loadAdminAsafoCompaniesListPage = () =>
  import('../pages/asafo/AdminAsafoCompaniesListPage.jsx')
export const loadAdminAsafoCompaniesSectionPage = () =>
  import('../pages/asafo/AdminAsafoCompaniesSectionPage.jsx')
export const loadAdminHallOfFameListPage = () =>
  import('../pages/hallOfFame/AdminHallOfFameListPage.jsx')
export const loadAdminHallOfFameCreatePage = () =>
  import('../pages/hallOfFame/AdminHallOfFameCreatePage.jsx')
export const loadAdminHallOfFameEditPage = () =>
  import('../pages/hallOfFame/AdminHallOfFameEditPage.jsx')
export const loadAdminGlobalSettingsPage = () =>
  import('../pages/globalsettings/AdminGlobalSettingsPage.jsx')
export const loadAdminHomepageSectionsListPage = () =>
  import('../pages/homePageSections/AdminHomepageSectionsListPage.jsx')
export const loadAdminHomepageSectionsCreatePage = () =>
  import('../pages/homePageSections/AdminHomepageSectionsCreatePage.jsx')
export const loadAdminHomepageSectionsEditPage = () =>
  import('../pages/homePageSections/AdminHomepageSectionsEditPage.jsx')
export const loadAdminLandmarksListPage = () =>
  import('../pages/landmarks/AdminLandmarksListPage.jsx')
export const loadAdminLandmarksCreatePage = () =>
  import('../pages/landmarks/AdminLandmarksCreatePage.jsx')
export const loadAdminLandmarksEditPage = () =>
  import('../pages/landmarks/AdminLandmarksEditPage.jsx')
export const loadAdminCarouselListPage = () =>
  import('../pages/carousel/AdminCarouselListPage.jsx')
export const loadAdminCarouselCreatePage = () =>
  import('../pages/carousel/AdminCarouselCreatePage.jsx')
export const loadAdminCarouselEditPage = () =>
  import('../pages/carousel/AdminCarouselEditPage.jsx')
export const loadAdminHistoryPage = () => import('../pages/history/AdminHistoryPage.jsx')
export const loadAdminAboutPageEditor = () =>
  import('../pages/aboutNyakrom/AdminAboutPageEditor.jsx')
export const loadAdminLeadershipGovernancePage = () =>
  import('../pages/aboutNyakrom/AdminLeadershipGovernancePage.jsx')
export const loadAdminEventsListPage = () =>
  import('../pages/events/AdminEventsListPage.jsx')
export const loadAdminEventFormPage = () => import('../pages/events/AdminEventFormPage.jsx')
export const loadAdminAnnouncementsListPage = () =>
  import('../pages/announcements/AdminAnnouncementsListPage.jsx')
export const loadAdminAnnouncementFormPage = () =>
  import('../pages/announcements/AdminAnnouncementFormPage.jsx')
export const loadAdminContactInfoPage = () =>
  import('../pages/contact/AdminContactInfoPage.jsx')
export const loadAdminFaqManagerPage = () =>
  import('../pages/contact/AdminFaqManagerPage.jsx')
export const loadAdminUsersPage = () =>
  import('../pages/adminUsers/AdminUsersPage.jsx')
export const loadDashboardPage = () => import('../pages/DashboardPage.jsx')
export const loadLoginPage = () => import('../pages/LoginPage.jsx')
export const loadNotFoundPage = () => import('../pages/NotFoundPage.jsx')
export const loadAdminPreviewRedirectPage = () =>
  import('../pages/AdminPreviewRedirectPage.jsx')

export const adminRouteDefinitions = [
  { key: 'login', path: '/login', loader: loadLoginPage },
  { key: 'dashboard', path: '/dashboard', loader: loadDashboardPage },
  { key: 'news-list', path: '/admin/news', loader: loadAdminNewsListPage },
  { key: 'news-create', path: '/admin/news/create', loader: loadAdminNewsCreatePage },
  { key: 'news-edit', path: '/admin/news/edit/:id', loader: loadAdminNewsEditPage },
  {
    key: 'obituaries-list',
    path: '/admin/obituaries',
    loader: loadAdminObituariesListPage,
  },
  {
    key: 'obituaries-create',
    path: '/admin/obituaries/create',
    loader: loadAdminObituariesCreatePage,
  },
  {
    key: 'obituaries-edit',
    path: '/admin/obituaries/edit/:id',
    loader: loadAdminObituariesEditPage,
  },
  { key: 'clans-list', path: '/admin/clans', loader: loadAdminClansListPage },
  { key: 'clans-create', path: '/admin/clans/create', loader: loadAdminClansCreatePage },
  { key: 'clans-edit', path: '/admin/clans/edit/:id', loader: loadAdminClansEditPage },
  {
    key: 'asafo-list',
    path: '/admin/asafo-companies',
    loader: loadAdminAsafoCompaniesListPage,
  },
  {
    key: 'asafo-section',
    path: '/admin/asafo-companies/section/:sectionId',
    loader: loadAdminAsafoCompaniesSectionPage,
  },
  {
    key: 'hall-of-fame-list',
    path: '/admin/hall-of-fame',
    loader: loadAdminHallOfFameListPage,
  },
  {
    key: 'hall-of-fame-create',
    path: '/admin/hall-of-fame/create',
    loader: loadAdminHallOfFameCreatePage,
  },
  {
    key: 'hall-of-fame-edit',
    path: '/admin/hall-of-fame/edit/:id',
    loader: loadAdminHallOfFameEditPage,
  },
  {
    key: 'global-settings',
    path: '/admin/global-settings',
    loader: loadAdminGlobalSettingsPage,
  },
  {
    key: 'homepage-sections-list',
    path: '/admin/homepage-sections',
    loader: loadAdminHomepageSectionsListPage,
  },
  {
    key: 'homepage-sections-create',
    path: '/admin/homepage-sections/create',
    loader: loadAdminHomepageSectionsCreatePage,
  },
  {
    key: 'homepage-sections-edit',
    path: '/admin/homepage-sections/edit/:id',
    loader: loadAdminHomepageSectionsEditPage,
  },
  {
    key: 'landmarks-list',
    path: '/admin/landmarks',
    loader: loadAdminLandmarksListPage,
  },
  {
    key: 'landmarks-create',
    path: '/admin/landmarks/create',
    loader: loadAdminLandmarksCreatePage,
  },
  {
    key: 'landmarks-edit',
    path: '/admin/landmarks/edit/:id',
    loader: loadAdminLandmarksEditPage,
  },
  { key: 'carousel-list', path: '/admin/carousel', loader: loadAdminCarouselListPage },
  {
    key: 'carousel-create',
    path: '/admin/carousel/create',
    loader: loadAdminCarouselCreatePage,
  },
  {
    key: 'carousel-edit',
    path: '/admin/carousel/edit/:id',
    loader: loadAdminCarouselEditPage,
  },
  { key: 'history', path: '/admin/history', loader: loadAdminHistoryPage },
  {
    key: 'leadership-governance',
    path: '/admin/about-nyakrom/leadership-governance',
    loader: loadAdminLeadershipGovernancePage,
  },
  {
    key: 'about-page-editor',
    path: '/admin/about-nyakrom/:slug',
    loader: loadAdminAboutPageEditor,
  },
  { key: 'events-list', path: '/admin/events', loader: loadAdminEventsListPage },
  {
    key: 'events-create',
    path: '/admin/events/new',
    loader: loadAdminEventFormPage,
    componentProps: { mode: 'create' },
  },
  {
    key: 'events-edit',
    path: '/admin/events/:id/edit',
    loader: loadAdminEventFormPage,
    componentProps: { mode: 'edit' },
  },
  {
    key: 'announcements-list',
    path: '/admin/announcements',
    loader: loadAdminAnnouncementsListPage,
  },
  {
    key: 'announcements-create',
    path: '/admin/announcements/new',
    loader: loadAdminAnnouncementFormPage,
    componentProps: { mode: 'create' },
  },
  {
    key: 'announcements-edit',
    path: '/admin/announcements/:id/edit',
    loader: loadAdminAnnouncementFormPage,
    componentProps: { mode: 'edit' },
  },
  { key: 'contact', path: '/admin/contact', loader: loadAdminContactInfoPage },
  { key: 'faqs', path: '/admin/faqs', loader: loadAdminFaqManagerPage },
  { key: 'admin-users', path: '/admin/users', loader: loadAdminUsersPage },
  {
    key: 'preview-redirect',
    path: '/admin/:resource/:id/preview',
    loader: loadAdminPreviewRedirectPage,
  },
  { key: 'not-found', path: '*', loader: loadNotFoundPage },
]

function getRequestIdleCallback() {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    window.requestIdleCallback ||
    ((callback) =>
      window.setTimeout(() => {
        callback({ didTimeout: false, timeRemaining: () => 0 })
      }, 1))
  )
}

function normalizeRouteHref(href) {
  if (!href || typeof href !== 'string') {
    return ''
  }

  const trimmed = href.trim()
  if (!trimmed || trimmed.startsWith('#')) {
    return ''
  }

  try {
    const parsed = new URL(
      trimmed,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    )
    if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) {
      return ''
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return ''
  }
}

function preloadLoader(loader) {
  if (routePreloadCache.has(loader)) {
    return
  }

  routePreloadCache.add(loader)
  void loader()
}

function findMatchingRoute(pathname) {
  return adminRouteDefinitions.find((definition) => {
    if (!definition.path || definition.path === '*') {
      return false
    }

    return Boolean(
      matchPath(
        {
          path: definition.path,
          end: true,
        },
        pathname,
      ),
    )
  })
}

export function preloadAdminRoute(href) {
  const normalizedHref = normalizeRouteHref(href)
  if (!normalizedHref) {
    return
  }

  const pathname = normalizedHref.split('#')[0]
  const matchedRoute = findMatchingRoute(pathname)
  if (!matchedRoute) {
    return
  }

  preloadLoader(matchedRoute.loader)
}

export function scheduleAdminRoutePrefetch(hrefs) {
  const idleCallback = getRequestIdleCallback()
  if (!idleCallback) {
    return
  }

  idleCallback(() => {
    hrefs.forEach((href) => preloadAdminRoute(href))
  })
}
