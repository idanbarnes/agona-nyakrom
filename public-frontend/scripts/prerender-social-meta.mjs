import fs from 'node:fs/promises'
import path from 'node:path'

const SITE_NAME = 'Agona Nyakrom'
const DEFAULT_DESCRIPTION =
  'Agona Nyakrom community news, history, events, announcements, landmarks, clans, and memorial pages.'
const DEFAULT_SITE_URL = normalizeOrigin(
  process.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5174',
)
const API_BASE_URL = normalizeOrigin(
  process.env.VITE_API_BASE_URL || 'http://localhost:5000',
)
const DIST_DIR = path.resolve(process.cwd(), 'dist')
const DIST_INDEX_PATH = path.join(DIST_DIR, 'index.html')
const DEFAULT_SHARE_IMAGE = `${DEFAULT_SITE_URL}/share-default.svg`
const SOCIAL_BLOCK_PATTERN =
  /<!-- social-meta:start -->[\s\S]*?<!-- social-meta:end -->/

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/$/, '')
}

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

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`
}

function withSiteSuffix(value) {
  const title = String(value || '').trim()
  if (!title) {
    return SITE_NAME
  }

  return title.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? title
    : `${title} | ${SITE_NAME}`
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

function selectImage(...candidates) {
  for (const candidate of candidates) {
    const resolved = resolveAbsoluteUrl(candidate, {
      preferSite: String(candidate || '').trim() === '/share-default.svg',
    })
    if (resolved) {
      return resolved
    }
  }

  return DEFAULT_SHARE_IMAGE
}

function buildCanonicalUrl(routePath) {
  if (!routePath || routePath === '/') {
    return `${DEFAULT_SITE_URL}/`
  }

  return `${DEFAULT_SITE_URL}${routePath.startsWith('/') ? routePath : `/${routePath}`}`
}

function injectMeta(template, meta) {
  const title = withSiteSuffix(meta.title)
  const description = truncate(meta.description || DEFAULT_DESCRIPTION, 200)
  const canonicalUrl = buildCanonicalUrl(meta.canonicalPath || meta.routePath)
  const image = selectImage(meta.image, DEFAULT_SHARE_IMAGE)
  const cardType = meta.cardType || 'summary_large_image'
  const ogType = meta.ogType || 'website'
  const imageAlt = truncate(meta.imageAlt || title, 420)
  const socialBlock = `<!-- social-meta:start -->
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta property="og:type" content="${escapeHtml(ogType)}" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />
<meta name="twitter:card" content="${escapeHtml(cardType)}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />
<!-- social-meta:end -->`

  const withTitle = template.includes('<title>')
    ? template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    : template.replace('</head>', `<title>${escapeHtml(title)}</title>\n</head>`)

  if (SOCIAL_BLOCK_PATTERN.test(withTitle)) {
    return withTitle.replace(SOCIAL_BLOCK_PATTERN, socialBlock)
  }

  return withTitle.replace('</head>', `${socialBlock}\n</head>`)
}

function createMeta(routePath, values = {}) {
  return {
    routePath,
    canonicalPath: values.canonicalPath || routePath,
    title: values.title || SITE_NAME,
    description: values.description || DEFAULT_DESCRIPTION,
    image: values.image || DEFAULT_SHARE_IMAGE,
    imageAlt: values.imageAlt || values.title || SITE_NAME,
    ogType: values.ogType || 'website',
    cardType: values.cardType || 'summary_large_image',
  }
}

function getItems(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  return []
}

function pickPaginationTotal(payload, items) {
  const total = Number(payload?.total)
  return Number.isFinite(total) && total >= 0 ? total : items.length
}

async function fetchJson(relativeUrl) {
  const response = await fetch(`${API_BASE_URL}${relativeUrl}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativeUrl}: ${response.status}`)
  }

  const payload = await response.json()
  return payload?.data ?? payload
}

async function fetchAllPages(relativeUrl, { pageSize = 100 } = {}) {
  const items = []
  let page = 1
  let total = Infinity

  while (items.length < total) {
    const separator = relativeUrl.includes('?') ? '&' : '?'
    const payload = await fetchJson(`${relativeUrl}${separator}page=${page}&limit=${pageSize}`)
    const pageItems = getItems(payload)
    items.push(...pageItems)
    total = pickPaginationTotal(payload, items)

    if (!pageItems.length || pageItems.length < pageSize) {
      break
    }

    page += 1
  }

  return items
}

function flattenLeaderGroups(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  return Object.values(payload || {}).flatMap((value) =>
    Array.isArray(value) ? value : [],
  )
}

function summaryFromFields(...values) {
  for (const value of values) {
    const normalized = truncate(stripHtml(value), 200)
    if (normalized) {
      return normalized
    }
  }

  return DEFAULT_DESCRIPTION
}

function mapStaticRoutes(aboutPages = {}) {
  return [
    createMeta('/', {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    }),
    createMeta('/news', {
      title: 'News',
      description: 'Read the latest news and public updates from Agona Nyakrom.',
    }),
    createMeta('/updates', {
      canonicalPath: '/news',
      title: 'Updates',
      description: 'Read the latest news and public updates from Agona Nyakrom.',
    }),
    createMeta('/obituaries', {
      title: 'Obituaries',
      description: 'Memorial notices and funeral information shared by the Agona Nyakrom community.',
    }),
    createMeta('/clans', {
      title: 'Family Clans',
      description: 'Explore Agona Nyakrom family clans, their history, and their leaders.',
    }),
    createMeta('/asafo-companies', {
      title: 'Asafo Companies',
      description: 'Learn about the Asafo companies of Agona Nyakrom and their stories.',
    }),
    createMeta('/hall-of-fame', {
      title: 'Hall of Fame',
      description: 'Celebrate honored individuals and their contributions to Agona Nyakrom.',
    }),
    createMeta('/landmarks', {
      title: 'Landmarks',
      description: 'Discover notable landmarks and heritage places in Agona Nyakrom.',
    }),
    createMeta('/announcements-events', {
      title: 'Announcements and Events',
      description: 'Follow current announcements and upcoming public events in Agona Nyakrom.',
    }),
    createMeta('/contact', {
      title: 'Contact',
      description: 'Find contact information and frequently asked questions for Agona Nyakrom.',
    }),
    createMeta('/about/leadership-governance', {
      title: 'Leadership and Governance',
      description:
        'Meet the traditional and community leaders serving Agona Nyakrom.',
    }),
    createMeta('/about-nyakrom/leadership-governance', {
      canonicalPath: '/about/leadership-governance',
      title: 'Leadership and Governance',
      description:
        'Meet the traditional and community leaders serving Agona Nyakrom.',
    }),
    createMeta('/about/history', {
      title: aboutPages.history?.meta_title || aboutPages.history?.page_title || 'History',
      description: summaryFromFields(
        aboutPages.history?.meta_description,
        aboutPages.history?.subtitle,
        aboutPages.history?.body,
      ),
      image: aboutPages.history?.share_image,
    }),
    createMeta('/history', {
      canonicalPath: '/about/history',
      title: aboutPages.history?.meta_title || aboutPages.history?.page_title || 'History',
      description: summaryFromFields(
        aboutPages.history?.meta_description,
        aboutPages.history?.subtitle,
        aboutPages.history?.body,
      ),
      image: aboutPages.history?.share_image,
    }),
    createMeta('/about/who-we-are', {
      title:
        aboutPages['who-we-are']?.meta_title ||
        aboutPages['who-we-are']?.page_title ||
        'Who We Are',
      description: summaryFromFields(
        aboutPages['who-we-are']?.meta_description,
        aboutPages['who-we-are']?.subtitle,
        aboutPages['who-we-are']?.body,
      ),
      image: aboutPages['who-we-are']?.share_image,
    }),
    createMeta('/about/about-agona-nyakrom-town', {
      title:
        aboutPages['about-agona-nyakrom-town']?.meta_title ||
        aboutPages['about-agona-nyakrom-town']?.page_title ||
        'About Agona Nyakrom Town',
      description: summaryFromFields(
        aboutPages['about-agona-nyakrom-town']?.meta_description,
        aboutPages['about-agona-nyakrom-town']?.subtitle,
        aboutPages['about-agona-nyakrom-town']?.body,
      ),
      image: aboutPages['about-agona-nyakrom-town']?.share_image,
    }),
  ]
}

function mapDynamicRoutes(content = {}) {
  const routes = []

  for (const item of content.news || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/news/${item.slug}`, {
        title: item.title,
        description: summaryFromFields(item.summary, item.content),
        image: selectImage(
          item?.images?.medium,
          item?.images?.large,
          item?.images?.original,
          item?.images?.thumbnail,
        ),
        imageAlt: item.title,
        ogType: 'article',
      }),
    )
  }

  for (const item of content.obituaries || []) {
    if (!item?.slug) continue
    const title = item.name || item.full_name || 'Obituary'
    const description = summaryFromFields(item.summary, item.biography)
    const image = selectImage(
      item.poster_image_url,
      item.deceased_photo_url,
      item?.images?.medium,
      item?.images?.large,
      item?.images?.original,
      item?.images?.thumbnail,
    )

    routes.push(
      createMeta(`/obituary/${item.slug}`, {
        title,
        description,
        image,
        imageAlt: title,
        ogType: 'article',
      }),
    )
    routes.push(
      createMeta(`/obituaries/${item.slug}`, {
        canonicalPath: `/obituary/${item.slug}`,
        title,
        description,
        image,
        imageAlt: title,
        ogType: 'article',
      }),
    )
  }

  for (const item of content.clans || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/clans/${item.slug}`, {
        title: item.name,
        description: summaryFromFields(item.intro, item.history),
        image: selectImage(
          item?.images?.large,
          item?.images?.medium,
          item?.images?.original,
          item?.images?.thumbnail,
        ),
      }),
    )
  }

  for (const item of content.asafo || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/asafo-companies/${item.slug}`, {
        title: item.seo_meta_title || item.title || item.name || 'Asafo Company',
        description: summaryFromFields(
          item.seo_meta_description,
          item.subtitle,
          item.body,
        ),
        image: selectImage(
          item.share_image,
          item.seo_share_image,
          item?.images?.medium,
          item?.images?.large,
          item?.images?.original,
          item?.images?.thumbnail,
        ),
      }),
    )
  }

  for (const item of content.hallOfFame || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/hall-of-fame/${item.slug}`, {
        title: item.name || 'Hall of Fame',
        description: summaryFromFields(item.bio, item.body, item.achievements),
        image: selectImage(
          item.imageUrl,
          item?.images?.medium,
          item?.images?.large,
          item?.images?.original,
          item?.images?.thumbnail,
        ),
      }),
    )
  }

  for (const item of content.landmarks || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/landmarks/${item.slug}`, {
        title: item.name,
        description: summaryFromFields(item.description),
        image: selectImage(
          item?.images?.medium,
          item?.images?.large,
          item?.images?.original,
          item?.images?.thumbnail,
        ),
      }),
    )
  }

  for (const item of Object.values(content.aboutPages || {})) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/about/${item.slug}`, {
        title: item.meta_title || item.page_title,
        description: summaryFromFields(
          item.meta_description,
          item.subtitle,
          item.body,
        ),
        image: selectImage(item.share_image, item.seo_share_image),
      }),
    )
  }

  for (const item of content.leaders || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/about/leadership-governance/${item.slug}`, {
        title: item.name || item.role_title || 'Leader Profile',
        description: summaryFromFields(item.short_bio_snippet, item.full_bio),
        image: selectImage(item.photo),
      }),
    )
  }

  for (const item of content.events || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/events/${item.slug}`, {
        title: item.title,
        description: summaryFromFields(item.excerpt, item.body),
        image: selectImage(item.flyer_image_path),
        imageAlt: item.flyer_alt_text || item.title,
        ogType: 'article',
      }),
    )
  }

  for (const item of content.announcements || []) {
    if (!item?.slug) continue
    routes.push(
      createMeta(`/announcements/${item.slug}`, {
        title: item.title,
        description: summaryFromFields(item.excerpt, item.body),
        image: selectImage(item.flyer_image_path),
        imageAlt: item.flyer_alt_text || item.title,
        ogType: 'article',
      }),
    )
  }

  return routes
}

async function writeRouteFile(template, meta) {
  const html = injectMeta(template, meta)
  const routePath = meta.routePath || '/'

  if (routePath === '/') {
    await fs.writeFile(DIST_INDEX_PATH, html, 'utf8')
    return
  }

  const trimmedRoute = routePath.replace(/^\/+|\/+$/g, '')
  const outputDir = path.join(DIST_DIR, ...trimmedRoute.split('/'))
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
}

async function loadContent() {
  const aboutSlugs = ['history', 'who-we-are', 'about-agona-nyakrom-town']
  const aboutPages = {}

  for (const slug of aboutSlugs) {
    try {
      aboutPages[slug] = await fetchJson(`/api/public/about/${slug}`)
    } catch (error) {
      console.warn(`[social-meta] skipped about page ${slug}: ${error.message}`)
    }
  }

  const requests = await Promise.allSettled([
    fetchAllPages('/api/public/news'),
    fetchAllPages('/api/public/obituaries'),
    fetchJson('/api/public/clans'),
    fetchJson('/api/public/asafo'),
    fetchJson('/api/public/hall-of-fame'),
    fetchAllPages('/api/public/landmarks'),
    fetchJson('/api/public/leaders'),
    fetchAllPages('/api/public/events?state=all'),
    fetchAllPages('/api/public/announcements'),
  ])

  const unwrap = (result, label, fallback = []) => {
    if (result.status === 'fulfilled') {
      return result.value
    }

    console.warn(`[social-meta] skipped ${label}: ${result.reason?.message || result.reason}`)
    return fallback
  }

  return {
    aboutPages,
    news: unwrap(requests[0], 'news'),
    obituaries: unwrap(requests[1], 'obituaries'),
    clans: unwrap(requests[2], 'clans'),
    asafo: unwrap(requests[3], 'asafo'),
    hallOfFame: unwrap(requests[4], 'hall-of-fame'),
    landmarks: unwrap(requests[5], 'landmarks'),
    leaders: flattenLeaderGroups(unwrap(requests[6], 'leaders', {})),
    events: unwrap(requests[7], 'events'),
    announcements: unwrap(requests[8], 'announcements'),
  }
}

async function main() {
  const template = await fs.readFile(DIST_INDEX_PATH, 'utf8')
  const content = await loadContent()
  const routes = [
    ...mapStaticRoutes(content.aboutPages),
    ...mapDynamicRoutes(content),
  ]
  const dedupedRoutes = new Map(routes.map((route) => [route.routePath, route]))

  for (const route of dedupedRoutes.values()) {
    await writeRouteFile(template, route)
  }

  console.log(
    `[social-meta] generated ${dedupedRoutes.size} prerendered metadata route${dedupedRoutes.size === 1 ? '' : 's'}.`,
  )
}

main().catch((error) => {
  console.error(`[social-meta] ${error.message}`)
  process.exitCode = 1
})
