const { getSeoConfig } = require('./config');
const {
  escapeHtml,
  normalizePath,
  resolveAbsoluteUrl,
  safeJsonLd,
  stripHtml,
  toIsoDate,
  truncate,
} = require('./utils');

const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const canonicalUrl = (config, path) => `${config.siteOrigin}${normalizePath(path) === '/' ? '/' : normalizePath(path)}`;

const applyTitleTemplate = (config, title) => {
  const normalized = String(title || '').trim();
  if (!normalized || normalized === config.defaultTitle) return config.defaultTitle;
  if (normalized.includes(config.platformName)) return normalized;
  return config.titleTemplate.replace('%s', normalized);
};

const breadcrumb = (config, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: canonicalUrl(config, item.path),
  })),
});

const organizationSchema = (config) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.organizationName,
    url: canonicalUrl(config, '/'),
    logo: config.logoUrl,
  };
  if (config.socialProfiles.length) {
    schema.sameAs = config.socialProfiles;
  }
  return schema;
};

const websiteSchema = (config) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: config.platformName,
  url: canonicalUrl(config, '/'),
});

const pickText = (...values) => {
  for (const value of values) {
    const text = stripHtml(value);
    if (text) return text;
  }
  return '';
};

const pickImage = (config, ...values) => {
  for (const value of values) {
    const absolute = resolveAbsoluteUrl(value, {
      siteOrigin: config.siteOrigin,
      assetOrigin: config.assetOrigin,
      defaultUrl: '',
    });
    if (absolute) return absolute;
  }
  return config.defaultSocialImage;
};

const renderInitialContent = ({
  title,
  description,
  image,
  imageAlt,
  dates = [],
  author,
  sectionName,
}) => {
  const facts = [
    sectionName ? `Section: ${sectionName}` : '',
    author ? `By ${author}` : '',
    ...dates,
  ].filter(Boolean);
  const imageMarkup = image
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt || title)}" loading="eager" />`
    : '';
  const factsMarkup = facts.length
    ? `<dl>${facts
        .map((fact) => `<div><dt>Detail</dt><dd>${escapeHtml(fact)}</dd></div>`)
        .join('')}</dl>`
    : '';

  return `<main data-seo-initial-content="true"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(
    description
  )}</p>${factsMarkup}${imageMarkup}</main>`;
};

const createDescriptor = (partial = {}, config = getSeoConfig()) => {
  const path = normalizePath(partial.path || '/');
  const title = applyTitleTemplate(config, partial.title || config.defaultTitle);
  const description = truncate(partial.description || config.defaultDescription, 220);
  const robots = partial.robots || 'index,follow';
  const image = partial.image
    ? resolveAbsoluteUrl(partial.image, {
        siteOrigin: config.siteOrigin,
        assetOrigin: config.assetOrigin,
        defaultUrl: config.defaultSocialImage,
      })
    : config.defaultSocialImage;

  return {
    title,
    description,
    canonicalUrl: robots.includes('noindex') ? '' : partial.canonicalUrl || canonicalUrl(config, path),
    robots,
    ogType: partial.ogType || 'website',
    image,
    imageAlt: partial.imageAlt || config.platformName,
    publishedDate: toIsoDate(partial.publishedDate),
    modifiedDate: toIsoDate(partial.modifiedDate),
    author: partial.author || '',
    contentType: partial.contentType || 'WebPage',
    structuredData: ensureArray(partial.structuredData),
    status: partial.status || 200,
    initialContent: partial.initialContent || '',
  };
};

const renderMetaTags = (descriptor, config = getSeoConfig()) => {
  const tags = [
    `<meta name="description" content="${escapeHtml(descriptor.description)}" />`,
    `<meta name="robots" content="${escapeHtml(descriptor.robots)}" />`,
  ];

  if (descriptor.canonicalUrl) {
    tags.push(`<link rel="canonical" href="${escapeHtml(descriptor.canonicalUrl)}" />`);
  }

  tags.push(
    `<meta property="og:type" content="${escapeHtml(descriptor.ogType)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(config.platformName)}" />`,
    `<meta property="og:locale" content="${escapeHtml(config.locale)}" />`,
    `<meta property="og:title" content="${escapeHtml(descriptor.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(descriptor.description)}" />`
  );

  if (descriptor.canonicalUrl) {
    tags.push(`<meta property="og:url" content="${escapeHtml(descriptor.canonicalUrl)}" />`);
  }

  tags.push(
    `<meta property="og:image" content="${escapeHtml(descriptor.image)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(descriptor.imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(descriptor.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(descriptor.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(descriptor.image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(descriptor.imageAlt)}" />`
  );

  for (const item of descriptor.structuredData) {
    tags.push(`<script type="application/ld+json">${safeJsonLd(item)}</script>`);
  }

  return tags.join('\n');
};

const injectSeoIntoHtml = (html, descriptor, config = getSeoConfig()) => {
  const title = `<title>${escapeHtml(descriptor.title)}</title>`;
  const metaBlock = `<!-- social-meta:start -->\n${renderMetaTags(descriptor, config)}\n<!-- social-meta:end -->`;
  const withTitle = /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, title)
    : html.replace('</head>', `${title}\n</head>`);
  const withMeta = /<!-- social-meta:start -->[\s\S]*?<!-- social-meta:end -->/i.test(withTitle)
    ? withTitle.replace(/<!-- social-meta:start -->[\s\S]*?<!-- social-meta:end -->/i, metaBlock)
    : withTitle.replace('</head>', `${metaBlock}\n</head>`);

  if (!descriptor.initialContent) {
    return withMeta;
  }

  return withMeta.replace(
    '<div id="root"></div>',
    `<div id="root">${descriptor.initialContent}</div>`
  );
};

const staticPageDescriptor = (path, title, description, schemaType = 'WebPage') => {
  const config = getSeoConfig();
  return createDescriptor({
    path,
    title,
    description,
    contentType: schemaType,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: title,
        description,
        url: canonicalUrl(config, path),
      },
      breadcrumb(config, [
        { name: 'Home', path: '/' },
        { name: title, path },
      ]),
    ],
  }, config);
};

const homepageDescriptor = () => {
  const config = getSeoConfig();
  return createDescriptor({
    path: '/',
    title: config.defaultTitle,
    description: config.defaultDescription,
    structuredData: [organizationSchema(config), websiteSchema(config)],
    initialContent: `<main><h1>${escapeHtml(config.platformName)}</h1><p>${escapeHtml(config.defaultDescription)}</p></main>`,
  }, config);
};

const contentDescriptor = ({
  path,
  sectionName,
  title,
  description,
  image,
  imageAlt,
  schema,
  ogType = 'article',
  publishedDate,
  modifiedDate,
  author,
  visibleDates = [],
}) => {
  const config = getSeoConfig();
  const pageTitle = `${title} | ${sectionName}`;
  const schemaType = schema['@type'];
  const isArticleLike = ['Article', 'NewsArticle', 'BlogPosting'].includes(schemaType);
  const baseSchema = {
    '@context': 'https://schema.org',
    ...schema,
    name: schema.name || title,
    description,
    url: canonicalUrl(config, path),
    image: image ? [image] : undefined,
  };

  if (isArticleLike) {
    baseSchema.headline = schema.headline || title;
    baseSchema.datePublished = toIsoDate(publishedDate) || undefined;
    baseSchema.dateModified = toIsoDate(modifiedDate) || undefined;
    baseSchema.author = author ? { '@type': 'Person', name: author } : undefined;
  } else if (schemaType === 'Event') {
    baseSchema.startDate = toIsoDate(schema.startDate) || schema.startDate;
  } else if (schemaType === 'WebPage' && schema.mainEntity) {
    baseSchema.mainEntity = schema.mainEntity;
  }

  const structuredData = [
    baseSchema,
    breadcrumb(config, [
      { name: 'Home', path: '/' },
      { name: sectionName, path: path.split('/').slice(0, -1).join('/') || '/' },
      { name: title, path },
    ]),
  ].map((item) => JSON.parse(JSON.stringify(item)));

  return createDescriptor({
    path,
    title: pageTitle,
    description,
    image,
    imageAlt,
    ogType,
    publishedDate,
    modifiedDate,
    author,
    structuredData,
    initialContent: renderInitialContent({
      title,
      description,
      image,
      imageAlt,
      sectionName,
      author,
      dates: [
        publishedDate ? `Published ${toIsoDate(publishedDate)}` : '',
        modifiedDate ? `Updated ${toIsoDate(modifiedDate)}` : '',
        ...visibleDates,
      ].filter(Boolean),
    }),
  }, config);
};

module.exports = {
  breadcrumb,
  canonicalUrl,
  contentDescriptor,
  createDescriptor,
  homepageDescriptor,
  injectSeoIntoHtml,
  organizationSchema,
  pickImage,
  pickText,
  renderMetaTags,
  staticPageDescriptor,
  websiteSchema,
};
