export function buildHallOfFameDetailPath(slugOrId) {
  const normalized = String(slugOrId || '').trim()
  if (!normalized) {
    return '/hall-of-fame'
  }

  return `/hall-of-fame/${encodeURIComponent(normalized)}/`
}
