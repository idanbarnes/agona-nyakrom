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

function buildObituaryCanonicalUrl(slug) {
  return `${DEFAULT_SITE_URL}/obituaries/${encodeURIComponent(slug)}/`
}

function buildAnnouncementCanonicalUrl(slug) {
  return `${DEFAULT_SITE_URL}/announcements/${encodeURIComponent(slug)}/`
}

function buildEventCanonicalUrl(slug) {
  return `${DEFAULT_SITE_URL}/events/${encodeURIComponent(slug)}/`
}

function buildNewsCanonicalUrl(slug) {
  return `${DEFAULT_SITE_URL}/news/${encodeURIComponent(slug)}/`
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

function buildObituaryDescription(entry) {
  const name = String(entry?.full_name || entry?.name || '').trim()
  const summaryCandidate = pickLeadParagraph(
    entry.summary || entry.biography || entry.description || '',
  )
  const normalizedSummary = summaryCandidate.toLowerCase()
  const nameParts = name
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length >= 3)

  if (
    summaryCandidate &&
    (!nameParts.length || nameParts.some((part) => normalizedSummary.includes(part)))
  ) {
    return truncate(summaryCandidate, 190)
  }

  const birthYear = entry?.date_of_birth ? new Date(entry.date_of_birth).getFullYear() : null
  const deathYear = entry?.date_of_death ? new Date(entry.date_of_death).getFullYear() : null
  const lifespan =
    birthYear && deathYear && Number.isFinite(birthYear) && Number.isFinite(deathYear)
      ? ` (${birthYear} - ${deathYear})`
      : ''
  const respectfulName = name || 'This loved one'

  return truncate(
    `Remembering ${respectfulName}${lifespan}. View obituary and service details shared by the ${SITE_NAME} community.`,
    190,
  )
}

function buildObituaryImage(entry) {
  const candidates = [
    entry.deceased_photo_url,
    entry.deceasedPhotoUrl,
    entry.poster_image_url,
    entry.posterImageUrl,
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

function buildObituaryMeta(entry) {
  const name = String(entry?.full_name || entry?.name || '').trim() || 'Obituary'
  return {
    slug: entry.slug,
    title: `${name} | Obituaries | ${SITE_NAME}`,
    description: buildObituaryDescription(entry),
    url: buildObituaryCanonicalUrl(entry.slug),
    image: buildObituaryImage(entry),
    imageAlt: name,
    type: 'article',
  }
}

function buildContentSummary(entry) {
  return pickLeadParagraph(entry.excerpt || entry.body || entry.description || entry.summary || '')
}

function buildAnnouncementDescription(entry) {
  const summaryCandidate = buildContentSummary(entry)
  if (summaryCandidate) {
    return truncate(summaryCandidate, 190)
  }

  const title = String(entry?.title || '').trim() || 'Announcement'
  return truncate(`${title}. Read the full announcement from ${SITE_NAME}.`, 190)
}

function buildEventDescription(entry) {
  const summaryCandidate = buildContentSummary(entry)
  if (summaryCandidate) {
    return truncate(summaryCandidate, 190)
  }

  const title = String(entry?.title || '').trim() || 'Event'
  const dateLabel = entry?.event_date ? stripHtml(new Date(entry.event_date).toDateString()) : ''
  const tagLabel = stripHtml(entry?.event_tag || '')
  const suffix = [tagLabel, dateLabel].filter(Boolean).join(' · ')
  return truncate(
    suffix
      ? `${title}. ${suffix}. View the full event details on ${SITE_NAME}.`
      : `${title}. View the full event details on ${SITE_NAME}.`,
    190,
  )
}

function buildFlyerImage(entry) {
  const candidates = [
    entry.flyer_image_path,
    entry.flyerImagePath,
    entry.imageUrl,
    entry.image_url,
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

function buildAnnouncementMeta(entry) {
  const title = String(entry?.title || '').trim() || 'Announcement'
  return {
    slug: entry.slug,
    title: `${title} | Announcements | ${SITE_NAME}`,
    description: buildAnnouncementDescription(entry),
    url: buildAnnouncementCanonicalUrl(entry.slug),
    image: buildFlyerImage(entry),
    imageAlt: entry?.flyer_alt_text || title,
    type: 'article',
  }
}

function buildEventMeta(entry) {
  const title = String(entry?.title || '').trim() || 'Event'
  return {
    slug: entry.slug,
    title: `${title} | Events | ${SITE_NAME}`,
    description: buildEventDescription(entry),
    url: buildEventCanonicalUrl(entry.slug),
    image: buildFlyerImage(entry),
    imageAlt: entry?.flyer_alt_text || title,
    type: 'article',
  }
}

function buildNewsDescription(entry) {
  const summaryCandidate = buildContentSummary(entry)
  if (summaryCandidate) {
    return truncate(summaryCandidate, 190)
  }

  const title = String(entry?.title || '').trim() || 'News update'
  return truncate(`${title}. Read the full story on ${SITE_NAME}.`, 190)
}

function buildNewsImage(entry) {
  const candidates = [
    entry?.images?.medium,
    entry?.images?.large,
    entry?.images?.original,
    entry?.images?.thumbnail,
    entry.image,
    entry.imageUrl,
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

function buildNewsMeta(entry) {
  const title = String(entry?.title || '').trim() || 'News'
  return {
    slug: entry.slug,
    title: `${title} | News | ${SITE_NAME}`,
    description: buildNewsDescription(entry),
    url: buildNewsCanonicalUrl(entry.slug),
    image: buildNewsImage(entry),
    imageAlt: title,
    type: 'article',
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

async function loadObituaryEntries() {
  const firstPage = await fetchJson('/api/public/obituaries?page=1&limit=100')
  const initialItems = Array.isArray(firstPage?.items)
    ? firstPage.items.filter((entry) => entry?.slug)
    : []
  const total = Number(firstPage?.total) || initialItems.length
  const limit = Number(firstPage?.limit) || 100
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (totalPages === 1) {
    return initialItems
  }

  const items = [...initialItems]
  for (let page = 2; page <= totalPages; page += 1) {
    const payload = await fetchJson(`/api/public/obituaries?page=${page}&limit=${limit}`)
    const pageItems = Array.isArray(payload?.items) ? payload.items.filter((entry) => entry?.slug) : []
    items.push(...pageItems)
  }

  const seen = new Set()
  return items.filter((entry) => {
    if (seen.has(entry.slug)) {
      return false
    }
    seen.add(entry.slug)
    return true
  })
}

async function loadAnnouncementEntries() {
  const firstPage = await fetchJson('/api/public/announcements?page=1&limit=100')
  const initialItems = Array.isArray(firstPage?.items)
    ? firstPage.items.filter((entry) => entry?.slug)
    : []
  const total = Number(firstPage?.total) || initialItems.length
  const limit = Number(firstPage?.limit) || 100
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (totalPages === 1) {
    return initialItems
  }

  const items = [...initialItems]
  for (let page = 2; page <= totalPages; page += 1) {
    const payload = await fetchJson(`/api/public/announcements?page=${page}&limit=${limit}`)
    const pageItems = Array.isArray(payload?.items)
      ? payload.items.filter((entry) => entry?.slug)
      : []
    items.push(...pageItems)
  }

  const seen = new Set()
  return items.filter((entry) => {
    if (seen.has(entry.slug)) {
      return false
    }
    seen.add(entry.slug)
    return true
  })
}

async function loadEventEntries() {
  const firstPage = await fetchJson('/api/public/events?state=all&page=1&limit=100')
  const initialItems = Array.isArray(firstPage?.items)
    ? firstPage.items.filter((entry) => entry?.slug)
    : []
  const total = Number(firstPage?.total) || initialItems.length
  const limit = Number(firstPage?.limit) || 100
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (totalPages === 1) {
    return initialItems
  }

  const items = [...initialItems]
  for (let page = 2; page <= totalPages; page += 1) {
    const payload = await fetchJson(`/api/public/events?state=all&page=${page}&limit=${limit}`)
    const pageItems = Array.isArray(payload?.items)
      ? payload.items.filter((entry) => entry?.slug)
      : []
    items.push(...pageItems)
  }

  const seen = new Set()
  return items.filter((entry) => {
    if (seen.has(entry.slug)) {
      return false
    }
    seen.add(entry.slug)
    return true
  })
}

async function loadNewsEntries() {
  const firstPage = await fetchJson('/api/public/news?page=1&limit=100')
  const initialItems = Array.isArray(firstPage?.items)
    ? firstPage.items.filter((entry) => entry?.slug)
    : []
  const total = Number(firstPage?.total) || initialItems.length
  const limit = Number(firstPage?.limit) || 100
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (totalPages === 1) {
    return initialItems
  }

  const items = [...initialItems]
  for (let page = 2; page <= totalPages; page += 1) {
    const payload = await fetchJson(`/api/public/news?page=${page}&limit=${limit}`)
    const pageItems = Array.isArray(payload?.items)
      ? payload.items.filter((entry) => entry?.slug)
      : []
    items.push(...pageItems)
  }

  const seen = new Set()
  return items.filter((entry) => {
    if (seen.has(entry.slug)) {
      return false
    }
    seen.add(entry.slug)
    return true
  })
}

async function writeHallOfFameRoute(template, meta) {
  const html = injectMeta(template, meta)
  const outputDir = path.join(DIST_DIR, 'hall-of-fame', meta.slug)
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
}

async function writeObituaryRoute(template, meta) {
  const html = injectMeta(template, meta)
  const outputDirs = [
    path.join(DIST_DIR, 'obituaries', meta.slug),
    path.join(DIST_DIR, 'obituary', meta.slug),
  ]

  for (const outputDir of outputDirs) {
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
  }
}

async function writeAnnouncementRoute(template, meta) {
  const html = injectMeta(template, meta)
  const outputDir = path.join(DIST_DIR, 'announcements', meta.slug)
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
}

async function writeEventRoute(template, meta) {
  const html = injectMeta(template, meta)
  const outputDir = path.join(DIST_DIR, 'events', meta.slug)
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
}

async function writeNewsRoute(template, meta) {
  const html = injectMeta(template, meta)
  const outputDir = path.join(DIST_DIR, 'news', meta.slug)
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
}

async function main() {
  const template = await fs.readFile(DIST_INDEX_PATH, 'utf8')
  await fs.writeFile(DIST_INDEX_PATH, injectMeta(template, buildHomeMeta()), 'utf8')
  const hallOfFameEntries = await loadHallOfFameEntries()
  const obituaryEntries = await loadObituaryEntries()
  const announcementEntries = await loadAnnouncementEntries()
  const eventEntries = await loadEventEntries()
  const newsEntries = await loadNewsEntries()

  for (const entry of hallOfFameEntries) {
    await writeHallOfFameRoute(template, buildHallOfFameMeta(entry))
  }

  for (const entry of obituaryEntries) {
    await writeObituaryRoute(template, buildObituaryMeta(entry))
  }

  for (const entry of announcementEntries) {
    await writeAnnouncementRoute(template, buildAnnouncementMeta(entry))
  }

  for (const entry of eventEntries) {
    await writeEventRoute(template, buildEventMeta(entry))
  }

  for (const entry of newsEntries) {
    await writeNewsRoute(template, buildNewsMeta(entry))
  }

  console.log(
    `[social-meta] generated ${hallOfFameEntries.length} Hall of Fame metadata route${hallOfFameEntries.length === 1 ? '' : 's'}, ${obituaryEntries.length} obituary metadata route${obituaryEntries.length === 1 ? '' : 's'}, ${announcementEntries.length} announcement metadata route${announcementEntries.length === 1 ? '' : 's'}, ${eventEntries.length} event metadata route${eventEntries.length === 1 ? '' : 's'}, and ${newsEntries.length} news metadata route${newsEntries.length === 1 ? '' : 's'}.`,
  )
}

main().catch((error) => {
  console.error(`[social-meta] ${error.message}`)
  process.exitCode = 1
})
