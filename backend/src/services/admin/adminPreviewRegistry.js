const newsAdminService = require('./newsAdminService');
const obituaryAdminService = require('./obituaryAdminService');
const clanAdminService = require('./clanAdminService');
const asafoAdminService = require('./asafoAdminService');
const hallOfFameAdminService = require('./hallOfFameAdminService');
const landmarkAdminService = require('./landmarkAdminService');
const eventsService = require('../eventsService');
const announcementsService = require('../announcementsService');
const leaderService = require('../leaderService');
const aboutPageService = require('../aboutPageService');
const contactCmsService = require('../contactCmsService');

const normalizeResource = (resource) => String(resource || '').trim().toLowerCase();

const slugOrFallback = (value, fallback) => {
  const normalized = String(value || '').trim();
  if (normalized) {
    return encodeURIComponent(normalized);
  }
  return encodeURIComponent(String(fallback || '').trim());
};

const createResource = ({
  key,
  aliases = [],
  loadById,
  toPublicPath,
  getPreviewId,
  canPreview,
}) => ({
  key,
  aliases,
  loadById,
  toPublicPath,
  getPreviewId:
    getPreviewId ||
    ((record, requestedId) => String(record?.id ?? requestedId ?? '').trim()),
  canPreview:
    canPreview ||
    ((record) => {
      return Boolean(record);
    }),
});

const RESOURCES = [
  createResource({
    key: 'news',
    aliases: ['post', 'posts'],
    loadById: (id) => newsAdminService.getById(id),
    toPublicPath: (record, requestedId) => `/news/${slugOrFallback(record?.slug, requestedId)}`,
  }),
  createResource({
    key: 'obituaries',
    aliases: ['obituary'],
    loadById: (id) => obituaryAdminService.getById(id),
    toPublicPath: (record, requestedId) => `/obituaries/${slugOrFallback(record?.slug, requestedId)}`,
  }),
  createResource({
    key: 'clans',
    aliases: ['clan'],
    loadById: (id) => clanAdminService.getById(id),
    toPublicPath: (record, requestedId) => `/clans/${slugOrFallback(record?.slug, requestedId)}`,
  }),
  createResource({
    key: 'asafo-companies',
    aliases: ['asafo', 'asafo-company'],
    loadById: (id) => asafoAdminService.getById(id),
    toPublicPath: (record, requestedId) =>
      `/asafo-companies/${slugOrFallback(record?.slug || record?.company_key, requestedId)}`,
  }),
  createResource({
    key: 'hall-of-fame',
    aliases: ['halloffame', 'hall_of_fame'],
    loadById: (id) => hallOfFameAdminService.getById(id),
    toPublicPath: (record, requestedId) =>
      `/hall-of-fame/${slugOrFallback(record?.slug || record?.id, requestedId)}`,
  }),
  createResource({
    key: 'landmarks',
    aliases: ['landmark'],
    loadById: (id) => landmarkAdminService.getById(id),
    toPublicPath: (record, requestedId) =>
      `/landmarks/${slugOrFallback(record?.slug, requestedId)}`,
  }),
  createResource({
    key: 'events',
    aliases: ['event'],
    loadById: (id) => eventsService.getEventById(id),
    toPublicPath: (record, requestedId) => `/events/${slugOrFallback(record?.slug, requestedId)}`,
  }),
  createResource({
    key: 'announcements',
    aliases: ['announcement'],
    loadById: (id) => announcementsService.getAnnouncementById(id),
    toPublicPath: (record, requestedId) =>
      `/announcements/${slugOrFallback(record?.slug, requestedId)}`,
  }),
  createResource({
    key: 'leaders',
    aliases: ['leader'],
    loadById: (id) => leaderService.getById(id),
    toPublicPath: (record, requestedId) =>
      `/about/leadership-governance/${slugOrFallback(record?.slug || record?.id, requestedId)}`,
  }),
  createResource({
    key: 'about-pages',
    aliases: ['about', 'about-page', 'page', 'pages'],
    loadById: (id) => aboutPageService.getBySlug(String(id || '').trim()),
    getPreviewId: (record, requestedId) => String(record?.slug || requestedId || '').trim(),
    toPublicPath: (record, requestedId) =>
      `/about/${slugOrFallback(record?.slug, requestedId)}`,
  }),
  createResource({
    key: 'faqs',
    aliases: ['faq'],
    loadById: (id) => contactCmsService.getFaqById(id),
    toPublicPath: () => '/contact',
  }),
];

const resourceMap = RESOURCES.reduce((acc, resource) => {
  acc.set(resource.key, resource);
  for (const alias of resource.aliases) {
    acc.set(alias, resource);
  }
  return acc;
}, new Map());

const getPreviewResource = (resource) => {
  const normalized = normalizeResource(resource);
  return resourceMap.get(normalized) || null;
};

const listPreviewResources = () => {
  return RESOURCES.map((resource) => resource.key);
};

module.exports = {
  normalizeResource,
  getPreviewResource,
  listPreviewResources,
};
