export function buildObituaryDetailPath(slug) {
  const normalized = String(slug || '').trim()
  if (!normalized) {
    return ''
  }

  return `/obituaries/${encodeURIComponent(normalized)}/`
}
