require('dotenv').config();

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { contentDescriptor, homepageDescriptor, renderMetaTags, staticPageDescriptor } = require('../seo/descriptors');
const { getSeoConfig } = require('../seo/config');
const { staticRoutes } = require('../seo/routeSeoService');

const TITLE_WARN_LENGTH = 60;
const DESCRIPTION_WARN_LENGTH = 160;

const sampleDetailDescriptors = () => [
  contentDescriptor({
    path: '/news/sample-news',
    sectionName: 'News',
    title: 'Sample News Story',
    description: 'Representative community news story used for SEO validation.',
    schema: { '@type': 'NewsArticle' },
    publishedDate: '2026-06-16T00:00:00Z',
    author: 'Editorial Team',
  }),
  contentDescriptor({
    path: '/obituaries/sample-person',
    sectionName: 'Obituaries',
    title: 'Sample Person',
    description: 'Representative obituary page used for SEO validation.',
    schema: {
      '@type': 'WebPage',
      mainEntity: { '@type': 'Person', name: 'Sample Person' },
    },
  }),
  contentDescriptor({
    path: '/clans/sample-clan',
    sectionName: 'Family Clans',
    title: 'Sample Clan',
    description: 'Representative clan profile used for SEO validation.',
    schema: { '@type': 'Article' },
  }),
  contentDescriptor({
    path: '/asafo-companies/sample-company',
    sectionName: 'Asafo Companies',
    title: 'Sample Asafo Company',
    description: 'Representative Asafo company profile used for SEO validation.',
    schema: { '@type': 'Organization' },
  }),
  contentDescriptor({
    path: '/landmarks/sample-landmark',
    sectionName: 'Landmarks and Attractions',
    title: 'Sample Landmark',
    description: 'Representative landmark profile used for SEO validation.',
    schema: { '@type': 'TouristAttraction' },
  }),
  contentDescriptor({
    path: '/hall-of-fame/sample-profile',
    sectionName: 'Hall of Fame',
    title: 'Sample Honoree',
    description: 'Representative hall-of-fame profile used for SEO validation.',
    schema: { '@type': 'Person' },
    ogType: 'profile',
  }),
  contentDescriptor({
    path: '/about/leadership-governance/sample-leader',
    sectionName: 'Leadership and Governance',
    title: 'Sample Leader',
    description: 'Representative leadership profile used for SEO validation.',
    schema: { '@type': 'Person', jobTitle: 'Leader' },
    ogType: 'profile',
  }),
  contentDescriptor({
    path: '/about/history',
    sectionName: 'About',
    title: 'History of Agona Nyakrom',
    description: 'Representative about page used for SEO validation.',
    schema: { '@type': 'AboutPage' },
  }),
  contentDescriptor({
    path: '/events/sample-event',
    sectionName: 'Events',
    title: 'Sample Event',
    description: 'Representative event page used for SEO validation.',
    schema: { '@type': 'Event', startDate: '2026-06-16T10:00:00Z' },
  }),
  contentDescriptor({
    path: '/announcements/sample-announcement',
    sectionName: 'Announcements',
    title: 'Sample Announcement',
    description: 'Representative announcement page used for SEO validation.',
    schema: { '@type': 'Article' },
  }),
];

const countMatches = (value, pattern) => (value.match(pattern) || []).length;

const validateDescriptor = (descriptor, warnings, errors) => {
  const label = descriptor.canonicalUrl || descriptor.title;
  const rendered = renderMetaTags(descriptor, getSeoConfig());
  const canonicalCount = countMatches(rendered, /rel="canonical"/g);
  const robotsCount = countMatches(rendered, /name="robots"/g);

  if (!descriptor.title.trim()) errors.push(`${label}: empty title`);
  if (!descriptor.description.trim()) errors.push(`${label}: empty description`);
  if (descriptor.title.length > TITLE_WARN_LENGTH) {
    warnings.push(`${label}: title length ${descriptor.title.length} exceeds ${TITLE_WARN_LENGTH}`);
  }
  if (descriptor.description.length > DESCRIPTION_WARN_LENGTH) {
    warnings.push(`${label}: description length ${descriptor.description.length} exceeds ${DESCRIPTION_WARN_LENGTH}`);
  }
  if (descriptor.robots.includes('index') && !descriptor.canonicalUrl) {
    errors.push(`${label}: indexable descriptor has no canonical URL`);
  }
  if (descriptor.canonicalUrl) {
    try {
      new URL(descriptor.canonicalUrl);
    } catch {
      errors.push(`${label}: invalid canonical URL`);
    }
  }
  if (canonicalCount > 1) errors.push(`${label}: generated multiple canonical tags`);
  if (robotsCount !== 1) errors.push(`${label}: generated ${robotsCount} robots tags`);
  if (/noindex/.test(descriptor.robots) && /index,follow/.test(descriptor.robots)) {
    errors.push(`${label}: conflicting robots directives`);
  }
};

const groupDuplicates = (descriptors, key) => {
  const groups = new Map();
  for (const descriptor of descriptors) {
    const value = descriptor[key];
    groups.set(value, [...(groups.get(value) || []), descriptor]);
  }
  return [...groups.entries()].filter(([, items]) => items.length > 1);
};

const main = () => {
  const staticDescriptors = [...staticRoutes.entries()].map(([path, [title, description, schemaType]]) =>
    staticPageDescriptor(path, title, description, schemaType)
  );
  const descriptors = [homepageDescriptor(), ...staticDescriptors, ...sampleDetailDescriptors()];
  const warnings = [];
  const errors = [];

  descriptors.forEach((descriptor) => validateDescriptor(descriptor, warnings, errors));

  for (const [title, items] of groupDuplicates(descriptors, 'title')) {
    warnings.push(`Duplicate title "${title}" on ${items.map((item) => item.canonicalUrl).join(', ')}`);
  }
  for (const [description, items] of groupDuplicates(descriptors, 'description')) {
    warnings.push(`Duplicate description "${description}" on ${items.map((item) => item.canonicalUrl).join(', ')}`);
  }

  warnings.forEach((warning) => console.warn(`SEO warning: ${warning}`));
  errors.forEach((error) => console.error(`SEO error: ${error}`));

  if (errors.length) {
    process.exitCode = 1;
  }

  console.log(`SEO metadata validation completed with ${warnings.length} warning(s) and ${errors.length} error(s).`);
};

main();
