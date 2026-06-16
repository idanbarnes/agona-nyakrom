const newsService = require('../services/public/newsService');
const obituaryService = require('../services/public/obituaryService');
const clanService = require('../services/public/clanService');
const asafoService = require('../services/public/asafoService');
const hallOfFameService = require('../services/public/hallOfFameService');
const landmarkService = require('../services/public/landmarkService');
const aboutPageService = require('../services/aboutPageService');
const leaderService = require('../services/leaderService');
const eventsService = require('../services/eventsService');
const announcementsService = require('../services/announcementsService');
const { getSeoConfig } = require('./config');
const {
  contentDescriptor,
  createDescriptor,
  homepageDescriptor,
  pickImage,
  pickText,
  staticPageDescriptor,
} = require('./descriptors');
const { normalizePath, toIsoDate, truncate } = require('./utils');

const toDisplayDate = (value) => {
  const iso = toIsoDate(value);
  return iso ? iso.slice(0, 10) : '';
};

const staticRoutes = new Map([
  ['/news', ['News and Updates', 'Latest community news, public updates, and stories from Agona Nyakrom.', 'CollectionPage']],
  ['/obituaries', ['Obituaries', 'Memorial notices and remembrance information shared by the Agona Nyakrom community.', 'CollectionPage']],
  ['/clans', ['Family Clans', 'Learn about Agona Nyakrom family clans, lineage history, and community contributions.', 'CollectionPage']],
  ['/asafo-companies', ['Asafo Companies', 'Explore Agona Nyakrom Asafo companies, their history, and cultural role.', 'CollectionPage']],
  ['/landmarks', ['Landmarks and Attractions', 'Discover landmarks, attractions, and places of interest in Agona Nyakrom.', 'CollectionPage']],
  ['/hall-of-fame', ['Hall of Fame', 'Celebrating people recognized for service, leadership, and contribution to Agona Nyakrom.', 'CollectionPage']],
  ['/about/leadership-governance', ['Leadership and Governance', 'Public leadership and governance profiles for Agona Nyakrom.', 'CollectionPage']],
  ['/announcements-events', ['Announcements and Events', 'Community announcements and event information for Agona Nyakrom.', 'CollectionPage']],
  ['/contact', ['Contact Agona Nyakrom', 'Official public contact information for Agona Nyakrom.', 'ContactPage']],
]);

const hasPreviewToken = (query = {}) =>
  Object.keys(query).some((key) => ['preview_token', 'token'].includes(String(key).toLowerCase()));

const noindexDescriptor = (path, title = 'Preview') =>
  createDescriptor({
    path,
    title,
    description: 'This page is not available for public indexing.',
    robots: 'noindex,nofollow',
    ogType: 'website',
    status: 200,
  });

const notFoundDescriptor = (path) =>
  createDescriptor({
    path,
    title: 'Page Not Found',
    description: 'The requested public page could not be found.',
    robots: 'noindex,nofollow',
    status: 404,
  });

const buildNews = async (slug) => {
  const item = await newsService.findBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  const image = pickImage(
    config,
    item.images?.medium,
    item.images?.large,
    item.images?.original,
    item.images?.thumbnail
  );
  return contentDescriptor({
    path: `/news/${item.slug}`,
    sectionName: 'News',
    title: item.title,
    description: truncate(pickText(item.summary, item.content) || `${item.title}. Read the full story from Agona Nyakrom.`, 200),
    image,
    imageAlt: item.title,
    schema: { '@type': 'NewsArticle' },
    ogType: 'article',
    publishedDate: item.published_at,
    modifiedDate: item.updated_at,
    author: item.reporter,
  });
};

const buildObituary = async (slug) => {
  const item = await obituaryService.findBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  const image = pickImage(
    config,
    item.deceased_photo_url,
    item.poster_image_url,
    item.images?.medium,
    item.images?.large
  );
  const years = [
    item.date_of_birth ? new Date(item.date_of_birth).getFullYear() : null,
    item.date_of_death ? new Date(item.date_of_death).getFullYear() : null,
  ].filter(Boolean);
  return contentDescriptor({
    path: `/obituaries/${item.slug}`,
    sectionName: 'Obituaries',
    title: item.full_name || item.name,
    description: truncate(pickText(item.summary, item.biography) || `Remembering ${item.full_name || item.name}${years.length === 2 ? ` (${years.join(' - ')})` : ''}.`, 200),
    image,
    imageAlt: item.full_name || item.name,
    schema: {
      '@type': 'WebPage',
      mainEntity: {
        '@type': 'Person',
        name: item.full_name || item.name,
        birthDate: item.date_of_birth || undefined,
        deathDate: item.date_of_death || undefined,
        image: image || undefined,
      },
    },
    ogType: 'article',
    modifiedDate: item.updated_at,
    visibleDates: [
      item.date_of_birth ? `Born ${toDisplayDate(item.date_of_birth)}` : '',
      item.date_of_death ? `Died ${toDisplayDate(item.date_of_death)}` : '',
      item.funeral_date ? `Funeral ${toDisplayDate(item.funeral_date)}` : '',
    ].filter(Boolean),
  });
};

const buildClan = async (slug) => {
  const item = await clanService.findBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  return contentDescriptor({
    path: `/clans/${item.slug}`,
    sectionName: 'Family Clans',
    title: item.name,
    description: truncate(pickText(item.intro, item.history, item.key_contributions) || `${item.name} family clan history and profile.`, 200),
    image: pickImage(config, item.images?.medium, item.images?.large, item.images?.original),
    imageAlt: item.name,
    schema: { '@type': 'Article' },
    modifiedDate: item.updated_at,
  });
};

const buildAsafo = async (slug) => {
  const item = await asafoService.findBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  const title = item.seo_meta_title || item.title || item.name;
  return contentDescriptor({
    path: `/asafo-companies/${item.slug || item.company_key}`,
    sectionName: 'Asafo Companies',
    title,
    description: truncate(item.seo_meta_description || pickText(item.body, item.description, item.history) || `${title} Asafo company profile.`, 200),
    image: pickImage(config, item.seo_share_image, item.share_image, item.images?.medium),
    imageAlt: title,
    schema: { '@type': 'Organization' },
    modifiedDate: item.updated_at,
  });
};

const buildHallOfFame = async (slug) => {
  const item = await hallOfFameService.findBySlugOrId(slug);
  if (!item) return null;
  const config = getSeoConfig();
  return contentDescriptor({
    path: `/hall-of-fame/${item.slug}`,
    sectionName: 'Hall of Fame',
    title: item.name,
    description: truncate(pickText(item.bio, item.body, item.achievements, item.title) || `${item.name} is featured in the Agona Nyakrom Hall of Fame.`, 200),
    image: pickImage(config, item.imageUrl, item.images?.medium, item.images?.large),
    imageAlt: item.name,
    schema: { '@type': 'Person', jobTitle: item.title || undefined },
    ogType: 'profile',
    modifiedDate: item.updated_at,
  });
};

const buildLandmark = async (slug) => {
  const item = await landmarkService.findBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  return contentDescriptor({
    path: `/landmarks/${item.slug}`,
    sectionName: 'Landmarks and Attractions',
    title: item.name,
    description: truncate(pickText(item.description) || `${item.name}, a landmark in Agona Nyakrom.`, 200),
    image: pickImage(config, item.images?.medium, item.images?.large, item.images?.original),
    imageAlt: item.name,
    schema: { '@type': 'TouristAttraction' },
    modifiedDate: item.updated_at,
  });
};

const buildLeader = async (slug) => {
  const item = (await leaderService.getPublishedBySlug(slug)) || (await leaderService.getPublishedById(slug));
  if (!item) return null;
  const config = getSeoConfig();
  return contentDescriptor({
    path: `/about/leadership-governance/${item.slug || item.id}`,
    sectionName: 'Leadership and Governance',
    title: item.name,
    description: truncate(pickText(item.short_bio_snippet, item.full_bio, item.role_title) || `${item.name}, ${item.role_title || 'leader'} in Agona Nyakrom.`, 200),
    image: pickImage(config, item.photo),
    imageAlt: item.name,
    schema: { '@type': 'Person', jobTitle: item.role_title || undefined },
    ogType: 'profile',
    modifiedDate: item.updated_at,
  });
};

const buildAbout = async (slug) => {
  const item = await aboutPageService.getPublishedBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  return contentDescriptor({
    path: `/about/${item.slug}`,
    sectionName: 'About',
    title: item.meta_title || item.page_title,
    description: truncate(item.meta_description || pickText(item.subtitle, item.body) || item.page_title, 200),
    image: pickImage(config, item.share_image, item.seo_share_image),
    imageAlt: item.page_title,
    schema: { '@type': 'AboutPage' },
    modifiedDate: item.updated_at,
  });
};

const buildEvent = async (slug) => {
  const item = await eventsService.getPublishedEventBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  const description = truncate(pickText(item.excerpt, item.body) || `${item.title}. Event date: ${item.event_date ? new Date(item.event_date).toDateString() : 'to be announced'}.`, 200);
  return contentDescriptor({
    path: `/events/${item.slug}`,
    sectionName: 'Events',
    title: item.title,
    description,
    image: pickImage(config, item.flyer_image_path),
    imageAlt: item.flyer_alt_text || item.title,
    schema: {
      '@type': 'Event',
      startDate: item.event_date || undefined,
    },
    ogType: 'article',
    publishedDate: item.created_at,
    modifiedDate: item.updated_at,
    visibleDates: [
      item.event_date ? `Event date ${toDisplayDate(item.event_date)}` : 'Event date to be announced',
    ],
  });
};

const buildAnnouncement = async (slug) => {
  const item = await announcementsService.getPublishedAnnouncementBySlug(slug);
  if (!item) return null;
  const config = getSeoConfig();
  return contentDescriptor({
    path: `/announcements/${item.slug}`,
    sectionName: 'Announcements',
    title: item.title,
    description: truncate(pickText(item.excerpt, item.body) || `${item.title}. Read the full announcement from Agona Nyakrom.`, 200),
    image: pickImage(config, item.flyer_image_path),
    imageAlt: item.flyer_alt_text || item.title,
    schema: { '@type': 'Article' },
    ogType: 'article',
    publishedDate: item.created_at,
    modifiedDate: item.updated_at,
  });
};

const dynamicMatchers = [
  [/^\/news\/([^/]+)$/, buildNews],
  [/^\/obituaries\/([^/]+)$/, buildObituary],
  [/^\/clans\/([^/]+)$/, buildClan],
  [/^\/asafo-companies\/([^/]+)$/, buildAsafo],
  [/^\/hall-of-fame\/([^/]+)$/, buildHallOfFame],
  [/^\/landmarks\/([^/]+)$/, buildLandmark],
  [/^\/about\/leadership-governance\/([^/]+)$/, buildLeader],
  [/^\/about\/(history|who-we-are|about-agona-nyakrom-town)$/, buildAbout],
  [/^\/events\/([^/]+)$/, buildEvent],
  [/^\/announcements\/([^/]+)$/, buildAnnouncement],
];

const resolveSeoForRoute = async (path, query = {}) => {
  const normalizedPath = normalizePath(path);
  if (hasPreviewToken(query) || normalizedPath.startsWith('/preview')) {
    return noindexDescriptor(normalizedPath, 'Preview');
  }
  if (normalizedPath === '/') {
    return homepageDescriptor();
  }
  if (staticRoutes.has(normalizedPath)) {
    const [title, description, schemaType] = staticRoutes.get(normalizedPath);
    return staticPageDescriptor(normalizedPath, title, description, schemaType);
  }
  for (const [pattern, builder] of dynamicMatchers) {
    const match = normalizedPath.match(pattern);
    if (!match) continue;
    if (String(process.env.SEO_DISABLE_DB_LOOKUPS || '').toLowerCase() === 'true') {
      return noindexDescriptor(normalizedPath, 'Public content');
    }
    const descriptor = await builder(decodeURIComponent(match[1]));
    return descriptor || notFoundDescriptor(normalizedPath);
  }
  return notFoundDescriptor(normalizedPath);
};

module.exports = {
  hasPreviewToken,
  noindexDescriptor,
  notFoundDescriptor,
  resolveSeoForRoute,
  staticRoutes,
};
