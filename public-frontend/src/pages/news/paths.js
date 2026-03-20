export function buildNewsDetailPath(slug) {
  const normalized = String(slug || '').trim()
  if (!normalized) {
    return '/news'
  }

  return `/news/${encodeURIComponent(normalized)}/`
}
