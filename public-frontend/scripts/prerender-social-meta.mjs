import fs from 'node:fs/promises'
import path from 'node:path'

const SITE_NAME = 'Agona Nyakrom'
const DIST_DIR = path.resolve(process.cwd(), 'dist')
const DIST_INDEX_PATH = path.join(DIST_DIR, 'index.html')
const HOME_DESCRIPTION =
  'Agona Nyakrom community news, history, events, announcements, landmarks, clans, and memorial pages.'
const SOCIAL_BLOCK_PATTERN =
  /<!-- social-meta:start -->[\s\S]*?<!-- social-meta:end -->/
const IS_RENDER_BUILD = String(process.env.RENDER || '')
  .trim()
  .toLowerCase() === 'true'

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/$/, '')
}

function isLoopbackHostname(hostname = '') {
  return /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|::1)$/i.test(String(hostname || '').trim())
}

function parseOrigin(label, value) {
  const normalized = normalizeOrigin(value)

  if (!normalized) {
    return null
  }

  let parsed
  try {
    parsed = new URL(normalized)
  } catch {
    throw new Error(
      `[social-meta] ${label} must be an absolute http(s) URL. Received "${value}".`,
    )
  }

  if (!/^https?:$/i.test(parsed.protocol)) {
    throw new Error(
      `[social-meta] ${label} must use http or https. Received "${value}".`,
    )
  }

  return normalizeOrigin(parsed.toString())
}

function resolveRequiredOrigin(label, envKey, localDefault) {
  const configured =
    parseOrigin(label, process.env[envKey] || '') ||
    (IS_RENDER_BUILD && envKey === 'VITE_PUBLIC_SITE_URL'
      ? parseOrigin(label, process.env.RENDER_EXTERNAL_URL || '')
      : null)

  if (!configured) {
    if (IS_RENDER_BUILD) {
      const fallbackHint =
        envKey === 'VITE_PUBLIC_SITE_URL'
          ? ' or ensure Render provides RENDER_EXTERNAL_URL'
          : ''
      throw new Error(
        `[social-meta] Missing required ${envKey} during Render build. Set it on the public static site${fallbackHint}, then rebuild.`,
      )
    }

    return localDefault
  }

  const hostname = new URL(configured).hostname
  if (IS_RENDER_BUILD && isLoopbackHostname(hostname)) {
    throw new Error(
      `[social-meta] ${envKey} cannot point to localhost during Render build. Received "${configured}".`,
    )
  }

  return configured
}

const DEFAULT_SITE_URL = resolveRequiredOrigin(
  'Public site URL',
  'VITE_PUBLIC_SITE_URL',
  'http://localhost:5174',
)
const API_BASE_URL = resolveRequiredOrigin(
  'API base URL',
  'VITE_API_BASE_URL',
  'http://localhost:5000',
)
const DEFAULT_SHARE_IMAGE = `${DEFAULT_SITE_URL}/share-default.svg`

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value = '', maxLength = 200) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`
}

function resolveAbsoluteUrl(value, { preferSite = false } = {}) {
  const rawValue = String(value || '').trim()
  if (!rawValue) {
    return ''
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue
  }

  if (/^\/\//.test(rawValue)) {
    return `https:${rawValue}`
  }

  if (/^(data:|blob:)/i.test(rawValue)) {
    return ''
  }

  const normalizedPath = rawValue.startsWith('/') ? rawValue : `/${rawValue}`
  const baseUrl =
    preferSite || !normalizedPath.startsWith('/uploads/') ? DEFAULT_SITE_URL : API_BASE_URL

  return `${baseUrl}${normalizedPath}`
}

function injectMeta(template, meta) {
  const socialBlock = `<!-- social-meta:start -->
<meta name="description" content="${escapeHtml(meta.description)}" />
<link rel="canonical" href="${escapeHtml(meta.url)}" />
<meta property="og:type" content="${escapeHtml(meta.type)}" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${escapeHtml(meta.title)}" />
<meta property="og:description" content="${escapeHtml(meta.description)}" />
<meta property="og:url" content="${escapeHtml(meta.url)}" />
<meta property="og:image" content="${escapeHtml(meta.image)}" />
<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(meta.title)}" />
<meta name="twitter:description" content="${escapeHtml(meta.description)}" />
<meta name="twitter:image" content="${escapeHtml(meta.image)}" />
<meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />
<!-- social-meta:end -->`

  const withTitle = template.includes('<title>')
    ? template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`)
    : template.replace('</head>', `<title>${escapeHtml(meta.title)}</title>\n</head>`)

  if (SOCIAL_BLOCK_PATTERN.test(withTitle)) {
    return withTitle.replace(SOCIAL_BLOCK_PATTERN, socialBlock)
  }

  return withTitle.replace('</head>', `${socialBlock}\n</head>`)
}

function buildCanonicalUrl(slug) {
  return `${DEFAULT_SITE_URL}/hall-of-fame/${encodeURIComponent(slug)}/`
}

function buildHomeMeta() {
  return {
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    url: `${DEFAULT_SITE_URL}/`,
    image: DEFAULT_SHARE_IMAGE,
    imageAlt: SITE_NAME,
    type: 'website',
  }
}

function pickLeadParagraph(value) {
  const raw = String(value || '').trim()
  if (!raw) {
    return ''
  }

  const [firstParagraph] = raw.split(/\r?\n\s*\r?\n/)
  return stripHtml(firstParagraph)
}

function buildDescription(entry) {
  const summaryCandidate = pickLeadParagraph(entry.bio || entry.body || entry.achievements)
  if (summaryCandidate) {
    return truncate(summaryCandidate, 190)
  }

  const role = stripHtml(entry.title || entry.position || '')
  if (role) {
    return truncate(
      `${entry.name} is featured in the ${SITE_NAME} Hall of Fame. ${role}.`,
      190,
    )
  }

  return truncate(
    `${entry.name} is featured in the ${SITE_NAME} Hall of Fame.`,
    190,
  )
}

function buildImage(entry) {
  const candidates = [
    entry.imageUrl,
    entry?.images?.medium,
    entry?.images?.large,
    entry?.images?.original,
    entry?.images?.thumbnail,
    '/share-default.svg',
  ]

  for (const candidate of candidates) {
    const absolute = resolveAbsoluteUrl(candidate, {
      preferSite: candidate === '/share-default.svg',
    })
    if (absolute) {
      return absolute
    }
  }

  return DEFAULT_SHARE_IMAGE
}

function buildHallOfFameMeta(entry) {
  const name = String(entry?.name || '').trim() || 'Hall of Fame'
  const title = `${name} | Hall of Fame | ${SITE_NAME}`

  return {
    slug: entry.slug,
    title,
    description: buildDescription(entry),
    url: buildCanonicalUrl(entry.slug),
    image: buildImage(entry),
    imageAlt: name,
    type: 'profile',
  }
}

async function fetchJson(relativeUrl) {
  const response = await fetch(`${API_BASE_URL}${relativeUrl}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativeUrl}: ${response.status}`)
  }

  const payload = await response.json()
  return payload?.data ?? payload
}

async function loadHallOfFameEntries() {
  const entries = await fetchJson('/api/public/hall-of-fame')
  return Array.isArray(entries) ? entries.filter((entry) => entry?.slug) : []
}

async function writeHallOfFameRoute(template, meta) {
  const html = injectMeta(template, meta)
  const outputDir = path.join(DIST_DIR, 'hall-of-fame', meta.slug)
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
}

async function main() {
  const template = await fs.readFile(DIST_INDEX_PATH, 'utf8')
  await fs.writeFile(DIST_INDEX_PATH, injectMeta(template, buildHomeMeta()), 'utf8')
  const hallOfFameEntries = await loadHallOfFameEntries()

  for (const entry of hallOfFameEntries) {
    await writeHallOfFameRoute(template, buildHallOfFameMeta(entry))
  }

  console.log(
    `[social-meta] generated ${hallOfFameEntries.length} Hall of Fame metadata route${hallOfFameEntries.length === 1 ? '' : 's'}.`,
  )
}

main().catch((error) => {
  console.error(`[social-meta] ${error.message}`)
  process.exitCode = 1
})
