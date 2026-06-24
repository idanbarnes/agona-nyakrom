import { buildApiUrl } from './apiBase.js'

const SESSION_STORAGE_KEY = 'agona_analytics_session'
const SESSION_TTL_MS = 30 * 60 * 1000
const READ_DEPTH_MILESTONES = [25, 50, 75, 90]
const trackedPageViews = new Set()
const readDepthState = new Map()

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function isAnalyticsEnabled() {
  if (!isBrowser()) return false
  if (import.meta.env.MODE === 'test') return false
  const configured = String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase()
  if (configured === 'false' || configured === '0') return false
  if (configured === 'true' || configured === '1') return true
  return import.meta.env.PROD === true
}

function createRandomId() {
  const bytes = new Uint8Array(18)
  window.crypto?.getRandomValues?.(bytes)
  if (bytes.some(Boolean)) {
    return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 24)
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 18)}`
}

function getSessionId() {
  if (!isBrowser() || !isAnalyticsEnabled()) return ''
  const now = Date.now()
  try {
    const current = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || 'null')
    if (current?.id && current?.expiresAt > now) {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ id: current.id, expiresAt: now + SESSION_TTL_MS }),
      )
      return current.id
    }
  } catch {
    // Ignore malformed local session data.
  }

  const next = { id: createRandomId(), expiresAt: now + SESSION_TTL_MS }
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next))
  } catch {
    return next.id
  }
  return next.id
}

function getDeviceCategory() {
  if (!isBrowser()) return 'unknown'
  const width = window.innerWidth || 0
  if (width && width < 768) return 'mobile'
  if (width && width < 1100) return 'tablet'
  return 'desktop'
}

function getCampaign() {
  if (!isBrowser()) return {}
  const params = new URLSearchParams(window.location.search)
  const campaign = {}
  ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
    const value = params.get(key)?.trim()
    if (value) campaign[key] = value.slice(0, 128)
  })
  return campaign
}

function getRouteContent(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  if (!segments.length) return { content_type: 'home' }
  if (segments[0] === 'news' && segments[1]) return { content_type: 'news', content_slug: segments[1] }
  if (segments[0] === 'obituaries' && segments[1]) return { content_type: 'obituary', content_slug: segments[1] }
  if (segments[0] === 'clans' && segments[1]) return { content_type: 'family_clan', content_slug: segments[1] }
  if (segments[0] === 'asafo-companies' && segments[1]) return { content_type: 'asafo_company', content_slug: segments[1] }
  if (segments[0] === 'landmarks' && segments[1]) return { content_type: 'landmark', content_slug: segments[1] }
  if (segments[0] === 'hall-of-fame' && segments[1]) return { content_type: 'hall_of_fame', content_slug: segments[1] }
  if (segments[0] === 'events' && segments[1]) return { content_type: 'event', content_slug: segments[1] }
  if (segments[0] === 'announcements' && segments[1]) return { content_type: 'announcement', content_slug: segments[1] }
  if (segments[0] === 'about' && segments[1] === 'leadership-governance' && segments[2]) {
    return { content_type: 'leader', content_slug: segments[2] }
  }
  if (segments[0] === 'about') return { content_type: 'about', content_slug: segments[1] }
  if (segments[0] === 'contact') return { content_type: 'contact' }
  return {}
}

function sendAnalytics(payload) {
  if (!isAnalyticsEnabled()) return
  const body = JSON.stringify({
    ...payload,
    anon_session_id: getSessionId(),
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
    device_category: getDeviceCategory(),
    referrer: document.referrer,
    campaign: getCampaign(),
  })
  const url = buildApiUrl('/api/analytics/events')

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(url, blob)) return
    }
  } catch {
    // Fall back to fetch below.
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function trackAnalyticsEvent(eventType, payload = {}) {
  sendAnalytics({ ...payload, event_type: eventType })
}

export function trackRouteView(location) {
  if (!isBrowser() || !location) return
  const pageKey = `${location.pathname}${location.search}`
  if (trackedPageViews.has(pageKey)) return
  trackedPageViews.add(pageKey)

  const content = getRouteContent(location.pathname)
  trackAnalyticsEvent('page_view', content)

  if (content.content_slug) {
    trackAnalyticsEvent('content_view', content)
  }
}

export function trackSearch({ query, resultCount, contentType }) {
  const normalized = String(query || '').trim()
  if (!normalized) return
  const eventType = resultCount === 0 ? 'zero_result_search' : 'search_performed'
  trackAnalyticsEvent(eventType, {
    content_type: contentType,
    search_query: normalized,
    search_result_count: resultCount,
  })
}

export function trackSearchResultClick({ query, resultCount, resultPosition, contentType, contentSlug }) {
  trackAnalyticsEvent('search_result_clicked', {
    content_type: contentType,
    content_slug: contentSlug,
    search_query: query,
    search_result_count: resultCount,
    search_result_position: resultPosition,
  })
}

export function resetReadDepth(pathKey) {
  readDepthState.set(pathKey, new Set())
}

export function trackReadDepthForScroll(pathKey) {
  if (!isBrowser()) return
  const sent = readDepthState.get(pathKey) || new Set()
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  const viewportHeight = window.innerHeight || 1
  const documentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight || 0,
    viewportHeight,
  )
  const readableHeight = Math.max(documentHeight - viewportHeight, 1)
  const percent = Math.min(100, Math.round(((scrollTop + viewportHeight) / readableHeight) * 100))
  const nextMilestone = READ_DEPTH_MILESTONES.find((milestone) => percent >= milestone && !sent.has(milestone))
  if (!nextMilestone) return
  sent.add(nextMilestone)
  readDepthState.set(pathKey, sent)
  trackAnalyticsEvent('read_depth', {
    ...getRouteContent(window.location.pathname),
    read_depth_percent: nextMilestone,
  })
}

export function trackApprovedClick(anchor) {
  if (!anchor || !isBrowser()) return
  const href = anchor.getAttribute('href') || ''
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return

  if (/^(mailto:|tel:)/i.test(href)) {
    trackAnalyticsEvent('contact_action_clicked', {
      content_type: 'contact',
      metadata: { target_type: href.split(':')[0] },
    })
    return
  }

  let parsed
  try {
    parsed = new URL(href, window.location.origin)
  } catch {
    return
  }

  const metadata = {
    target_domain: parsed.hostname,
    target_path: parsed.pathname,
  }

  if (parsed.origin !== window.location.origin) {
    const isShare =
      /facebook|twitter|x\.com|whatsapp|wa\.me|linkedin/i.test(parsed.hostname) ||
      anchor.dataset.analyticsEvent === 'share_clicked'
    trackAnalyticsEvent(isShare ? 'share_clicked' : 'outbound_link_clicked', { metadata })
    return
  }

  const activeSearch = document.querySelector('input[type="search"]')
  const activeSearchValue = activeSearch?.value?.trim()
  if (activeSearchValue) {
    trackSearchResultClick({
      query: activeSearchValue,
      resultPosition: Number.parseInt(anchor.dataset.analyticsPosition || '0', 10) || undefined,
      ...getRouteContent(parsed.pathname),
    })
  }

  if (anchor.dataset.analyticsEvent === 'related_content_clicked') {
    trackAnalyticsEvent('related_content_clicked', {
      ...getRouteContent(parsed.pathname),
      metadata,
    })
  }
}

export const analyticsSessionPolicy = {
  storage: 'sessionStorage',
  ttlMinutes: SESSION_TTL_MS / 60000,
  description: 'Random browser-session identifier, not derived from IP address or fingerprinting.',
}
