const PUBLIC_SETTINGS_CACHE_KEY = 'agona_nyakrom_public_settings_v1'
const PUBLIC_SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readRawCache() {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(PUBLIC_SETTINGS_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function getCachedPublicSettings() {
  const cached = readRawCache()
  if (!cached) {
    return { settings: null, isFresh: false }
  }

  const timestamp = Number(cached.timestamp || 0)
  const settings = cached.settings ?? null
  const isFresh =
    Boolean(settings) &&
    Number.isFinite(timestamp) &&
    Date.now() - timestamp < PUBLIC_SETTINGS_CACHE_TTL_MS

  return { settings, isFresh }
}

export function setCachedPublicSettings(settings) {
  const storage = getStorage()
  if (!storage || !settings) {
    return
  }

  try {
    storage.setItem(
      PUBLIC_SETTINGS_CACHE_KEY,
      JSON.stringify({
        settings,
        timestamp: Date.now(),
      }),
    )
  } catch {
    // Ignore storage quota and private-mode write failures.
  }
}

export function clearCachedPublicSettings() {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.removeItem(PUBLIC_SETTINGS_CACHE_KEY)
  } catch {
    // Ignore storage access failures.
  }
}

export { PUBLIC_SETTINGS_CACHE_TTL_MS }
