const PUBLIC_SITE_URL = String(import.meta.env.VITE_PUBLIC_SITE_URL || '').trim()
const DEV_PUBLIC_SITE_URL = 'http://localhost:5174'

export function resolvePreviewTargetUrl(payload) {
  const rawTarget = String(payload?.public_url || payload?.public_path || '').trim()
  if (!rawTarget) {
    return ''
  }

  if (/^https?:\/\//i.test(rawTarget)) {
    return rawTarget
  }

  const fallbackBase =
    PUBLIC_SITE_URL || (import.meta.env.DEV ? DEV_PUBLIC_SITE_URL : window.location.origin)

  try {
    return new URL(rawTarget, fallbackBase).toString()
  } catch {
    return rawTarget
  }
}

