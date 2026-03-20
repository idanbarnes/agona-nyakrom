export function buildAnnouncementDetailPath(slug) {
  const normalized = String(slug || '').trim()
  if (!normalized) {
    return '/announcements-events'
  }

  return `/announcements/${encodeURIComponent(normalized)}/`
}

export function buildEventDetailPath(slug) {
  const normalized = String(slug || '').trim()
  if (!normalized) {
    return '/announcements-events'
  }

  return `/events/${encodeURIComponent(normalized)}/`
}
