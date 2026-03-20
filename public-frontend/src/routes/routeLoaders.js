import { matchPath } from 'react-router-dom'

const routePreloadCache = new Set()

export const loadHomePage = () => import('../pages/Home.jsx')
export const loadNewsListPage = () => import('../pages/news/NewsList.jsx')
export const loadNewsDetailPage = () => import('../pages/news/NewsDetail.jsx')
export const loadObituaryListPage = () => import('../pages/obituaries/ObituaryList.jsx')
export const loadObituaryDetailPage = () => import('../pages/obituaries/ObituaryDetail.jsx')
export const loadClanListPage = () => import('../pages/clans/ClanList.jsx')
export const loadClanDetailPage = () => import('../pages/clans/ClanDetail.jsx')
export const loadAsafoListPage = () => import('../pages/asafo/AsafoList.jsx')
export const loadAsafoDetailPage = () => import('../pages/asafo/AsafoDetail.jsx')
export const loadHallOfFameListPage = () => import('../pages/hallOfFame/HallOfFameList.jsx')
export const loadHallOfFameDetailPage = () =>
  import('../pages/hallOfFame/HallOfFameDetail.jsx')
export const loadContactPage = () => import('../pages/Contact.jsx')
export const loadLandmarksListPage = () => import('../pages/landmarks/LandmarksList.jsx')
export const loadLandmarksDetailPage = () =>
  import('../pages/landmarks/LandmarksDetail.jsx')
export const loadAboutRichPage = () => import('../pages/about/AboutRichPage.jsx')
export const loadLeadershipGovernancePage = () =>
  import('../pages/about/LeadershipGovernance.jsx')
export const loadLeaderProfilePage = () => import('../pages/about/LeaderProfile.jsx')
export const loadAnnouncementsEventsPage = () =>
  import('../pages/AnnouncementsEventsPage.jsx')
export const loadEventDetailPage = () => import('../pages/events/EventDetail.jsx')
export const loadAnnouncementDetailPage = () =>
  import('../pages/announcements/AnnouncementDetail.jsx')
export const loadNotFoundPage = () => import('../pages/NotFound.jsx')

export const publicRouteDefinitions = [
  { key: 'home', index: true, fullPath: '/', loader: loadHomePage, title: 'Home' },
  {
    key: 'news-list',
    path: 'news',
    fullPath: '/news',
    loader: loadNewsListPage,
    title: 'News',
  },
  {
    key: 'updates-list',
    path: 'updates',
    fullPath: '/updates',
    loader: loadNewsListPage,
    title: 'Updates',
  },
  {
    key: 'news-detail',
    path: 'news/:slug',
    fullPath: '/news/:slug',
    loader: loadNewsDetailPage,
    title: 'News',
  },
  {
    key: 'obituary-list',
    path: 'obituaries',
    fullPath: '/obituaries',
    loader: loadObituaryListPage,
    title: 'Obituaries',
  },
  {
    key: 'obituary-id-detail',
    path: 'obituary/:id',
    fullPath: '/obituary/:id',
    loader: loadObituaryDetailPage,
    title: 'Obituary',
  },
  {
    key: 'obituary-slug-detail',
    path: 'obituaries/:slug',
    fullPath: '/obituaries/:slug',
    loader: loadObituaryDetailPage,
    title: 'Obituary',
  },
  {
    key: 'clan-list',
    path: 'clans',
    fullPath: '/clans',
    loader: loadClanListPage,
    title: 'Clans',
  },
  {
    key: 'clan-detail',
    path: 'clans/:slug',
    fullPath: '/clans/:slug',
    loader: loadClanDetailPage,
    title: 'Clan',
  },
  {
    key: 'asafo-list',
    path: 'asafo-companies',
    fullPath: '/asafo-companies',
    loader: loadAsafoListPage,
    title: 'Asafo Companies',
  },
  {
    key: 'asafo-detail',
    path: 'asafo-companies/:slug',
    fullPath: '/asafo-companies/:slug',
    loader: loadAsafoDetailPage,
    title: 'Asafo Companies',
  },
  {
    key: 'hall-of-fame-list',
    path: 'hall-of-fame',
    fullPath: '/hall-of-fame',
    loader: loadHallOfFameListPage,
    title: 'Hall of Fame',
  },
  {
    key: 'hall-of-fame-detail',
    path: 'hall-of-fame/:slug',
    fullPath: '/hall-of-fame/:slug',
    loader: loadHallOfFameDetailPage,
    title: 'Hall of Fame',
  },
  {
    key: 'landmarks-list',
    path: 'landmarks',
    fullPath: '/landmarks',
    loader: loadLandmarksListPage,
    title: 'Landmarks',
  },
  {
    key: 'landmarks-detail',
    path: 'landmarks/:slug',
    fullPath: '/landmarks/:slug',
    loader: loadLandmarksDetailPage,
    title: 'Landmark',
  },
  {
    key: 'about-leadership',
    path: 'about/leadership-governance',
    fullPath: '/about/leadership-governance',
    loader: loadLeadershipGovernancePage,
    title: 'Leadership & Governance',
  },
  {
    key: 'about-leader-profile',
    path: 'about/leadership-governance/:slug',
    fullPath: '/about/leadership-governance/:slug',
    loader: loadLeaderProfilePage,
    title: 'Leadership Profile',
  },
  {
    key: 'about-rich-page',
    path: 'about/:slug',
    fullPath: '/about/:slug',
    loader: loadAboutRichPage,
    title: 'About Nyakrom',
  },
  {
    key: 'announcements-events',
    path: 'announcements-events',
    fullPath: '/announcements-events',
    loader: loadAnnouncementsEventsPage,
    title: 'Announcements & Events',
  },
  {
    key: 'event-detail',
    path: 'events/:slug',
    fullPath: '/events/:slug',
    loader: loadEventDetailPage,
    title: 'Event',
  },
  {
    key: 'announcement-detail',
    path: 'announcements/:slug',
    fullPath: '/announcements/:slug',
    loader: loadAnnouncementDetailPage,
    title: 'Announcement',
  },
  {
    key: 'contact',
    path: 'contact',
    fullPath: '/contact',
    loader: loadContactPage,
    title: 'Contact Us',
  },
  { key: 'not-found', path: '*', fullPath: '*', loader: loadNotFoundPage, title: 'Page Not Found' },
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

  if (/^(mailto:|tel:|javascript:)/i.test(trimmed)) {
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
  return publicRouteDefinitions.find((definition) => {
    if (!definition.fullPath || definition.fullPath === '*') {
      return false
    }

    return Boolean(
      matchPath(
        {
          path: definition.fullPath,
          end: true,
        },
        pathname,
      ),
    )
  })
}

export function getPublicRouteTitle(pathname) {
  const matchedRoute = findMatchingRoute(pathname)
  if (matchedRoute?.title) {
    return matchedRoute.title
  }

  return (
    publicRouteDefinitions.find((definition) => definition.key === 'not-found')?.title || ''
  )
}

export function preloadPublicRoute(href) {
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

export function schedulePublicRoutePrefetch(hrefs) {
  const idleCallback = getRequestIdleCallback()
  if (!idleCallback) {
    return
  }

  idleCallback(() => {
    hrefs.forEach((href) => preloadPublicRoute(href))
  })
}
