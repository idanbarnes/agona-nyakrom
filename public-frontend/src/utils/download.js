const CONTENT_TYPE_EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

function sanitizeFilename(value) {
  const rawValue = String(value || '').trim()
  if (!rawValue) {
    return ''
  }

  const withoutControlCharacters = Array.from(rawValue, (character) =>
    character.charCodeAt(0) < 32 ? '-' : character,
  ).join('')

  return withoutControlCharacters
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractFilenameFromDisposition(disposition) {
  if (!disposition) {
    return ''
  }

  const utfMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) {
    try {
      return sanitizeFilename(decodeURIComponent(utfMatch[1]))
    } catch {
      return sanitizeFilename(utfMatch[1])
    }
  }

  const standardMatch =
    disposition.match(/filename\s*=\s*"([^"]+)"/i) ||
    disposition.match(/filename\s*=\s*([^;]+)/i)

  return sanitizeFilename(standardMatch?.[1] || '')
}

function extractExtensionFromUrl(url) {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    const match = parsedUrl.pathname.match(/\.([a-z0-9]{2,8})$/i)
    return match?.[1]?.toLowerCase() || ''
  } catch {
    const match = String(url || '').match(/\.([a-z0-9]{2,8})(?:[?#].*)?$/i)
    return match?.[1]?.toLowerCase() || ''
  }
}

function extractExtensionFromType(contentType) {
  if (!contentType) {
    return ''
  }

  const normalizedType = String(contentType).split(';')[0].trim().toLowerCase()
  return CONTENT_TYPE_EXTENSIONS[normalizedType] || ''
}

function ensureExtension(filename, extension) {
  const safeFilename = sanitizeFilename(filename)
  if (!safeFilename) {
    return extension ? `download.${extension}` : 'download'
  }

  if (!extension || /\.[a-z0-9]{2,8}$/i.test(safeFilename)) {
    return safeFilename
  }

  return `${safeFilename}.${extension}`
}

function triggerBrowserDownload(url, filename) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export async function downloadRemoteFile({
  url,
  filename,
  fallbackBaseName = 'download',
}) {
  if (!url) {
    throw new Error('Missing file URL.')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}.`)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition')
  const contentType = response.headers.get('content-type')
  const serverFilename = extractFilenameFromDisposition(contentDisposition)
  const extension =
    extractExtensionFromUrl(response.url || url) || extractExtensionFromType(contentType)
  const resolvedFilename = ensureExtension(
    serverFilename || filename || fallbackBaseName,
    extension,
  )

  const objectUrl = URL.createObjectURL(blob)
  try {
    triggerBrowserDownload(objectUrl, resolvedFilename)
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  return resolvedFilename
}

export function openFileFallback(url) {
  if (!url) {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
