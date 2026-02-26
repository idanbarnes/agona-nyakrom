const RESOURCE_ALIASES = {
  post: 'news',
  posts: 'news',
  obituary: 'obituaries',
  clan: 'clans',
  asafo: 'asafo-companies',
  halloffame: 'hall-of-fame',
  hall_of_fame: 'hall-of-fame',
  announcement: 'announcements',
  event: 'events',
  leader: 'leaders',
  page: 'about-pages',
  pages: 'about-pages',
}

const SUPPORTED_RESOURCES = new Set([
  'news',
  'obituaries',
  'clans',
  'asafo-companies',
  'hall-of-fame',
  'landmarks',
  'events',
  'announcements',
  'leaders',
  'about-pages',
])

export function normalizePreviewResource(resource) {
  const normalized = String(resource || '').trim().toLowerCase()
  if (!normalized) {
    return ''
  }
  return RESOURCE_ALIASES[normalized] || normalized
}

export function isPreviewSupported(resource) {
  const normalized = normalizePreviewResource(resource)
  return SUPPORTED_RESOURCES.has(normalized)
}

export function buildAdminPreviewPath(resource, id) {
  const normalizedResource = normalizePreviewResource(resource)
  const normalizedId = String(id || '').trim()

  if (!normalizedResource || !normalizedId || !isPreviewSupported(normalizedResource)) {
    return ''
  }

  return `/admin/${normalizedResource}/${encodeURIComponent(normalizedId)}/preview`
}
