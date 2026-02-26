// Entry point for the Agona Nyakrom backend
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const { pool } = require('./src/config/db');

// Import routers
const newsRoutes = require('./src/routes/newsRoutes');
const obituaryRoutes = require('./src/routes/obituaryRoutes');
const clanRoutes = require('./src/routes/clanRoutes');
const asafoRoutes = require('./src/routes/asafoRoutes');
const landMarkRoutes = require('./src/routes/landmarkRoutes');
const hallOfFameRoutes = require('./src/routes/hallOfFameRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const adminAuthRoutes = require('./src/routes/adminAuthRoutes');
const adminTestRoutes = require('./src/routes/adminTestRoutes');
const adminBaseRoutes = require('./src/routes/admin/adminBaseRoutes');
const newsAdminRoutes = require('./src/routes/admin/newsAdminRoutes');
const obituaryAdminRoutes = require('./src/routes/admin/obituaryAdminRoutes');
const clanAdminRoutes = require('./src/routes/admin/clanAdminRoutes');
const asafoAdminRoutes = require('./src/routes/admin/asafoAdminRoutes');
const hallOfFameAdminRoutes = require('./src/routes/admin/hallOfFameAdminRoutes');
const landmarkAdminRoutes = require('./src/routes/admin/landmarkAdminRoutes');
const carouselAdminRoutes = require('./src/routes/admin/carouselAdminRoutes');
const adminGlobalSettingsRoutes = require('./src/routes/admin/globalSettingsRoutes');
const homepageSectionAdminRoutes = require('./src/routes/admin/homepageSectionAdminRoutes');
const homepageBlockAdminRoutes = require('./src/routes/admin/homepageBlockAdminRoutes');
const historyPageAdminRoutes = require('./src/routes/admin/historyPageRoutes');
const aboutPageAdminRoutes = require('./src/routes/admin/aboutPageRoutes');
const leadersAdminRoutes = require('./src/routes/admin/leadersAdminRoutes');
const adminEventsRoutes = require('./src/routes/adminEventsRoutes');
const adminAnnouncementsRoutes = require('./src/routes/adminAnnouncementsRoutes');
const adminPreviewRoutes = require('./src/routes/admin/previewRoutes');

// for handling public endpoints routing
const publicNewsRoutes = require('./src/routes/public/newsRoutes');
const publicObituaryRoutes = require('./src/routes/public/obituaryRoutes');
const publicClansRoutes = require('./src/routes/public/clanRoutes');
const publicAsafoRoutes = require('./src/routes/public/asafoRoutes');
const publicHallOfFameRoutes = require('./src/routes/public/hallOfFameRoutes');
const publicLandmarkRoutes = require('./src/routes/public/landmarkRoutes');
const publicCarouselRoutes = require('./src/routes/public/carouselRoutes');
const publicGlobalSettingsRoutes = require('./src/routes/public/globalSettingsRoutes');
const publicHomepageRoutes = require('./src/routes/public/homepageRoutes');
const publicHistoryPageRoutes = require('./src/routes/public/historyPageRoutes');
const publicAboutRoutes = require('./src/routes/public/aboutRoutes');
const publicLeadersRoutes = require('./src/routes/public/leadersRoutes');
const publicEventsRoutes = require('./src/routes/publicEventsRoutes');
const publicAnnouncementsRoutes = require('./src/routes/publicAnnouncementsRoutes');
const publicAnnouncementsEventsRoutes = require('./src/routes/publicAnnouncementsEventsRoutes');

// Public site meta configuration for social sharing.
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'http://localhost:5173';
const PUBLIC_ASSET_BASE_URL =
  process.env.PUBLIC_ASSET_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000';
const DEFAULT_SHARE_IMAGE =
  process.env.PUBLIC_SHARE_IMAGE_URL || `${PUBLIC_SITE_URL}/share-default.svg`;

const frontendRoot = path.join(process.cwd(), '..', 'public-frontend');
const htmlCandidates = [
  path.join(frontendRoot, 'dist', 'index.html'),
  path.join(frontendRoot, 'index.html'),
];
let cachedHtmlTemplate = null;

const getHtmlTemplate = () => {
  if (cachedHtmlTemplate) {
    return cachedHtmlTemplate;
  }

  for (const filePath of htmlCandidates) {
    if (fs.existsSync(filePath)) {
      cachedHtmlTemplate = fs.readFileSync(filePath, 'utf8');
      return cachedHtmlTemplate;
    }
  }

  cachedHtmlTemplate =
    '<!doctype html><html><head><title>Agona Nyakrom</title></head><body><div id="root"></div></body></html>';
  return cachedHtmlTemplate;
};

const escapeMeta = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const stripHtml = (value = '') => String(value).replace(/<[^>]+>/g, '').trim();

const resolvePublicUrl = (urlPath = '') => {
  if (!urlPath) return '';
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath;
  }
  const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${PUBLIC_ASSET_BASE_URL.replace(/\/$/, '')}${normalized}`;
};

const injectMetaTags = (html, { title, description, url, image }) => {
  const metaTags = [
    `<meta property="og:title" content="${escapeMeta(title)}" />`,
    `<meta property="og:description" content="${escapeMeta(description)}" />`,
    `<meta property="og:url" content="${escapeMeta(url)}" />`,
    `<meta property="og:image" content="${escapeMeta(image)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeMeta(title)}" />`,
    `<meta name="twitter:description" content="${escapeMeta(description)}" />`,
    `<meta name="twitter:image" content="${escapeMeta(image)}" />`,
  ].join('\n');

  const withTitle = html.includes('<title>')
    ? html.replace(/<title>.*<\/title>/, `<title>${escapeMeta(title)}</title>`)
    : html.replace('</head>', `<title>${escapeMeta(title)}</title>\n</head>`);

  return withTitle.replace('</head>', `${metaTags}\n</head>`);
};

const buildMetaPayload = (item, urlPath, fallbackTitle) => {
  const title = item?.title || fallbackTitle;
  const descriptionSource = item?.excerpt || item?.body || '';
  const description = stripHtml(descriptionSource).slice(0, 200) || fallbackTitle;
  const url = `${PUBLIC_SITE_URL.replace(/\/$/, '')}${urlPath}`;
  const image = item?.flyer_image_path
    ? resolvePublicUrl(item.flyer_image_path)
    : DEFAULT_SHARE_IMAGE;

  return { title, description, url, image };
};

const fetchEventMeta = async (slug) => {
  const { rows } = await pool.query(
    `SELECT title, excerpt, body, flyer_image_path
     FROM events
     WHERE slug = $1 AND is_published = true
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

const fetchAnnouncementMeta = async (slug) => {
  const { rows } = await pool.query(
    `SELECT title, excerpt, body, flyer_image_path
     FROM announcements
     WHERE slug = $1 AND is_published = true
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};


const app = express();

// Global middleware
app.use(cors()); // Allow cross-origin requests (frontend and admin panel)
app.use(express.json()); // Parse incoming JSON payloads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/news', newsRoutes);
app.use('/api/obituaries', obituaryRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/asafo-companies', asafoRoutes);
app.use('/api/landmarks', landMarkRoutes);
app.use('/api/hall-of-fame', hallOfFameRoutes);
app.use('/api', settingsRoutes);//this handles history, homepage-settings, global-settings
app.use('/api/admin/auth', adminAuthRoutes);//ensure that protected routes receives authentication first.
app.use('/api/admin/protected', adminTestRoutes);
app.use('/api/admin', adminBaseRoutes);
app.use('/api/admin', adminPreviewRoutes);
app.use('/api/admin/news', newsAdminRoutes);
app.use('/api/admin/obituaries', obituaryAdminRoutes);
app.use('/api/admin/clans', clanAdminRoutes);
app.use('/api/admin/asafo-companies', asafoAdminRoutes);
app.use('/api/admin/asafo', asafoAdminRoutes);
app.use('/api/admin/hall-of-fame', hallOfFameAdminRoutes);
app.use('/api/admin/landmarks', landmarkAdminRoutes);
app.use('/api/admin/carousel', carouselAdminRoutes);
app.use('/api/admin/global-settings', adminGlobalSettingsRoutes);
app.use('/api/admin/homepage-sections', homepageSectionAdminRoutes);
app.use('/api/admin/homepage-blocks', homepageBlockAdminRoutes);
app.use('/api/admin/history', historyPageAdminRoutes);
app.use('/api/admin/about-pages', aboutPageAdminRoutes);
app.use('/api/admin/leaders', leadersAdminRoutes);
app.use('/api/admin/events', adminEventsRoutes);
app.use('/api/admin/announcements', adminAnnouncementsRoutes);

//for handling public endpoints (registerd)
app.use('/api/public/news', publicNewsRoutes);
app.use('/api/public/obituaries', publicObituaryRoutes);
app.use('/api/public/clans', publicClansRoutes);
app.use('/api/public/asafo-companies', publicAsafoRoutes);
app.use('/api/public/asafo', publicAsafoRoutes);
app.use('/api/public/hall-of-fame', publicHallOfFameRoutes);
app.use('/api/public/landmarks', publicLandmarkRoutes);
app.use('/api/public/carousel', publicCarouselRoutes);
app.use('/api/public/global-settings', publicGlobalSettingsRoutes);
app.use('/api/public/homepage', publicHomepageRoutes);
app.use('/api/public/history', publicHistoryPageRoutes);
app.use('/api/public/about', publicAboutRoutes);
app.use('/api/public/leaders', publicLeadersRoutes);
app.use('/api/public/events', publicEventsRoutes);
app.use('/api/public/announcements', publicAnnouncementsRoutes);
app.use('/api/public/announcements-events', publicAnnouncementsEventsRoutes);

// Server-rendered meta tags for event and announcement detail pages.
app.get('/events/:slug', async (req, res) => {
  try {
    const html = getHtmlTemplate();
    const item = await fetchEventMeta(req.params.slug);
    const meta = buildMetaPayload(
      item,
      req.originalUrl,
      'Agona Nyakrom Event'
    );
    res.type('html').send(injectMetaTags(html, meta));
  } catch (error) {
    const html = getHtmlTemplate();
    const meta = buildMetaPayload(null, req.originalUrl, 'Agona Nyakrom Event');
    res.type('html').send(injectMetaTags(html, meta));
  }
});

app.get('/announcements/:slug', async (req, res) => {
  try {
    const html = getHtmlTemplate();
    const item = await fetchAnnouncementMeta(req.params.slug);
    const meta = buildMetaPayload(
      item,
      req.originalUrl,
      'Agona Nyakrom Announcement'
    );
    res.type('html').send(injectMetaTags(html, meta));
  } catch (error) {
    const html = getHtmlTemplate();
    const meta = buildMetaPayload(
      null,
      req.originalUrl,
      'Agona Nyakrom Announcement'
    );
    res.type('html').send(injectMetaTags(html, meta));
  }
});


// Health check endpoint to verify server availability
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running' });
});

// Normalize errors (especially multer) to JSON responses for the admin UI.
app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error.',
    });
  }

  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

const PORT = process.env.PORT || 5000;

// Bootstrap the server and ensure DB connectivity before listening
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1); // Exit so issues are caught early in development
  }
};

startServer();

module.exports = app;
