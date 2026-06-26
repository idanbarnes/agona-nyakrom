const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { connectDB, pool } = require('./config/db');
const { validateRuntimeEnv, normalize, isTruthy } = require('./config/env');
const { uploadsRoot } = require('./config/storage');

const newsRoutes = require('./routes/newsRoutes');
const obituaryRoutes = require('./routes/obituaryRoutes');
const clanRoutes = require('./routes/clanRoutes');
const asafoRoutes = require('./routes/asafoRoutes');
const landMarkRoutes = require('./routes/landmarkRoutes');
const hallOfFameRoutes = require('./routes/hallOfFameRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminTestRoutes = require('./routes/adminTestRoutes');
const adminBaseRoutes = require('./routes/admin/adminBaseRoutes');
const newsAdminRoutes = require('./routes/admin/newsAdminRoutes');
const obituaryAdminRoutes = require('./routes/admin/obituaryAdminRoutes');
const clanAdminRoutes = require('./routes/admin/clanAdminRoutes');
const asafoAdminRoutes = require('./routes/admin/asafoAdminRoutes');
const hallOfFameAdminRoutes = require('./routes/admin/hallOfFameAdminRoutes');
const landmarkAdminRoutes = require('./routes/admin/landmarkAdminRoutes');
const carouselAdminRoutes = require('./routes/admin/carouselAdminRoutes');
const adminGlobalSettingsRoutes = require('./routes/admin/globalSettingsRoutes');
const homepageSectionAdminRoutes = require('./routes/admin/homepageSectionAdminRoutes');
const homepageBlockAdminRoutes = require('./routes/admin/homepageBlockAdminRoutes');
const historyPageAdminRoutes = require('./routes/admin/historyPageRoutes');
const aboutPageAdminRoutes = require('./routes/admin/aboutPageRoutes');
const leadersAdminRoutes = require('./routes/admin/leadersAdminRoutes');
const adminEventsRoutes = require('./routes/adminEventsRoutes');
const adminAnnouncementsRoutes = require('./routes/adminAnnouncementsRoutes');
const adminPreviewRoutes = require('./routes/admin/previewRoutes');
const contactAdminRoutes = require('./routes/admin/contactAdminRoutes');
const faqAdminRoutes = require('./routes/admin/faqAdminRoutes');
const adminUserRoutes = require('./routes/admin/adminUserRoutes');
const faqsAdminCompatRoutes = require('./routes/faqsAdminCompatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const analyticsAdminRoutes = require('./routes/admin/analyticsAdminRoutes');

const publicNewsRoutes = require('./routes/public/newsRoutes');
const publicObituaryRoutes = require('./routes/public/obituaryRoutes');
const publicClansRoutes = require('./routes/public/clanRoutes');
const publicAsafoRoutes = require('./routes/public/asafoRoutes');
const publicHallOfFameRoutes = require('./routes/public/hallOfFameRoutes');
const publicLandmarkRoutes = require('./routes/public/landmarkRoutes');
const publicCarouselRoutes = require('./routes/public/carouselRoutes');
const publicGlobalSettingsRoutes = require('./routes/public/globalSettingsRoutes');
const publicHomepageRoutes = require('./routes/public/homepageRoutes');
const publicHistoryPageRoutes = require('./routes/public/historyPageRoutes');
const publicAboutRoutes = require('./routes/public/aboutRoutes');
const publicLeadersRoutes = require('./routes/public/leadersRoutes');
const publicEventsRoutes = require('./routes/publicEventsRoutes');
const publicAnnouncementsRoutes = require('./routes/publicAnnouncementsRoutes');
const publicAnnouncementsEventsRoutes = require('./routes/publicAnnouncementsEventsRoutes');
const publicContactRoutes = require('./routes/public/contactRoutes');
const publicFaqRoutes = require('./routes/public/faqRoutes');
const { injectSeoIntoHtml } = require('./seo/descriptors');
const { getSeoConfig } = require('./seo/config');
const { buildRobotsTxt, buildSitemapXml } = require('./seo/sitemapService');
const { notFoundDescriptor, resolveSeoForRoute } = require('./seo/routeSeoService');
const { normalizePath: normalizeSeoPath } = require('./seo/utils');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BACKEND_ROOT, '..');
const DEFAULT_PORT = 5000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

const normalizeOrigin = (value = '') => normalize(value).replace(/\/$/, '');

const collectOrigins = (values = []) =>
  [...new Set(values.map((value) => normalizeOrigin(value)).filter(Boolean))];

const collectLocalUnifiedOrigins = (port) =>
  collectOrigins([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);

const hasFileExtension = (requestPath = '') => {
  try {
    return Boolean(path.extname(decodeURIComponent(requestPath)));
  } catch {
    return Boolean(path.extname(requestPath));
  }
};

const prefersHtml = (req) => {
  const accept = String(req.headers.accept || '').toLowerCase();
  return !accept || accept.includes('text/html') || accept.includes('*/*');
};

const getRuntimeConfig = () => {
  const runtimePort = resolveServerPort();
  const unifiedSiteUrl = normalizeOrigin(process.env.UNIFIED_SITE_URL || '');
  const publicSiteUrl = normalizeOrigin(
    unifiedSiteUrl || process.env.PUBLIC_SITE_URL || 'http://localhost:5174'
  );
  const adminSiteUrl = normalizeOrigin(process.env.ADMIN_SITE_URL || 'http://localhost:5173');
  const publicAssetBaseUrl = normalizeOrigin(
    process.env.PUBLIC_ASSET_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000'
  );
  const defaultShareImage =
    process.env.PUBLIC_SHARE_IMAGE_URL || `${publicSiteUrl}/share-default.svg`;
  const corsAllowedOrigins = collectOrigins(
    String(process.env.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
  );

  return {
    unifiedSiteUrl,
    publicSiteUrl,
    adminSiteUrl,
    publicAssetBaseUrl,
    defaultShareImage,
    allowedOrigins: collectOrigins([
      ...corsAllowedOrigins,
      publicSiteUrl,
      adminSiteUrl,
      unifiedSiteUrl,
      ...collectLocalUnifiedOrigins(runtimePort),
    ]),
    trustProxy: isTruthy(process.env.TRUST_PROXY),
  };
};

const buildFrontendPaths = (overrides = {}) => {
  const publicDistDir =
    overrides.publicDistDir ||
    process.env.PUBLIC_FRONTEND_DIST_DIR ||
    path.join(BACKEND_ROOT, 'dist', 'public');
  const adminDistDir =
    overrides.adminDistDir ||
    process.env.ADMIN_FRONTEND_DIST_DIR ||
    path.join(BACKEND_ROOT, 'dist', 'admin');

  return {
    publicDistDir,
    adminDistDir,
    publicIndexPath: path.join(publicDistDir, 'index.html'),
    publicAssetsDir: path.join(publicDistDir, 'assets'),
    adminIndexPath: path.join(adminDistDir, 'index.html'),
    adminAssetsDir: path.join(adminDistDir, 'assets'),
    repoRoot: REPO_ROOT,
  };
};

const assertUnifiedBuildExists = (frontendPaths) => {
  const requiredPaths = [
    { label: 'public frontend index', filePath: frontendPaths.publicIndexPath },
    { label: 'public frontend assets directory', filePath: frontendPaths.publicAssetsDir },
    { label: 'admin frontend index', filePath: frontendPaths.adminIndexPath },
    { label: 'admin frontend assets directory', filePath: frontendPaths.adminAssetsDir },
  ];

  const missing = requiredPaths.filter(({ filePath }) => !fs.existsSync(filePath));
  if (!missing.length) {
    return;
  }

  const details = missing.map(({ label, filePath }) => `${label}: ${filePath}`).join('; ');
  throw new Error(
    `Unified runtime build output is missing. Run "npm run build:unified" from ${frontendPaths.repoRoot}. Missing: ${details}`
  );
};

const createHtmlTemplateReader = (htmlPath) => {
  let cachedHtmlTemplate = null;
  let cachedTemplateSignature = null;

  return () => {
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`Unified runtime HTML template not found at ${htmlPath}`);
    }

    const stats = fs.statSync(htmlPath);
    const templateSignature = `${stats.mtimeMs}:${stats.size}`;

    if (cachedHtmlTemplate && cachedTemplateSignature === templateSignature) {
      return cachedHtmlTemplate;
    }

    cachedHtmlTemplate = fs.readFileSync(htmlPath, 'utf8');
    cachedTemplateSignature = templateSignature;
    return cachedHtmlTemplate;
  };
};

const sendIndexFile = (res, filePath) => {
  res.type('html');
  res.sendFile(filePath);
};

const sendAdminIndex = (res, filePath) => {
  const html = fs.readFileSync(filePath, 'utf8');
  const noindex = '<meta name="robots" content="noindex,nofollow" />';
  res.type('html').send(
    html.includes('name="robots"') ? html : html.replace('</head>', `${noindex}\n</head>`)
  );
};

const sendSeoHtml = async (req, res, getHtmlTemplate) => {
  const html = getHtmlTemplate();
  const config = getSeoConfig();
  try {
    const descriptor = await resolveSeoForRoute(req.path, req.query);
    res.status(descriptor.status || 200).type('html').send(injectSeoIntoHtml(html, descriptor, config));
  } catch (error) {
    console.error(`SEO HTML transform failed for ${req.originalUrl}:`, error.message);
    const descriptor = notFoundDescriptor(req.path);
    res.type('html').send(injectSeoIntoHtml(html, { ...descriptor, status: 200 }, config));
  }
};

const redirectTo = (target, status = 301) => (req, res) => {
  res.redirect(status, target);
};

const redirectCanonicalPublicPath = (req, res, next) => {
  if (req.method !== 'GET' || !prefersHtml(req) || hasFileExtension(req.path)) {
    return next();
  }

  if (
    req.path === '/' ||
    req.path.startsWith('/api/') ||
    req.path === '/api' ||
    req.path.startsWith('/admin') ||
    req.path.startsWith('/uploads/')
  ) {
    return next();
  }

  const normalizedPath = normalizeSeoPath(req.path);
  if (normalizedPath !== req.path) {
    return res.redirect(301, normalizedPath);
  }

  return next();
};

const resolveServerPort = (rawPort = process.env.PORT) => {
  const normalizedPort = normalize(rawPort);
  if (!normalizedPort) {
    return DEFAULT_PORT;
  }

  const port = Number(normalizedPort);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(
      `Invalid PORT value "${rawPort}". Set PORT to an integer between ${MIN_PORT} and ${MAX_PORT}.`
    );
  }

  return port;
};

const buildPortInUseMessage = (port) =>
  `Port ${port} is already in use.

Another local server may already be running.

Windows PowerShell:
  netstat -ano | findstr :${port}
  taskkill /PID <PID> /F

Warning: confirm the process identity before killing it.

Or start this application on another port:
  $env:PORT=${port + 1}
  npm run start:unified`;

const logStartupFailure = (error, port) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(buildPortInUseMessage(port));
    return;
  }

  console.error('Failed to start unified runtime:', error);
};

const createApp = (options = {}) => {
  const runtimeConfig = getRuntimeConfig();
  const frontendPaths = buildFrontendPaths(options);
  const publicIndexPath = frontendPaths.publicIndexPath;
  const adminIndexPath = frontendPaths.adminIndexPath;
  const getHtmlTemplate = createHtmlTemplateReader(publicIndexPath);
  const hasPublicBuild = fs.existsSync(publicIndexPath);
  const hasAdminBuild = fs.existsSync(adminIndexPath);

  const app = express();

  app.set('trust proxy', runtimeConfig.trustProxy);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = normalizeOrigin(origin);
        if (runtimeConfig.allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
    })
  );
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend running' });
  });

  app.use('/uploads/tmp', (req, res) => {
    res.status(404).send('Not found');
  });
  app.use('/uploads', express.static(uploadsRoot));

  app.use('/api/news', newsRoutes);
  app.use('/api/obituaries', obituaryRoutes);
  app.use('/api/clans', clanRoutes);
  app.use('/api/asafo-companies', asafoRoutes);
  app.use('/api/landmarks', landMarkRoutes);
  app.use('/api/hall-of-fame', hallOfFameRoutes);
  app.use('/api', settingsRoutes);
  app.use('/api/admin/auth', adminAuthRoutes);
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
  app.use('/api/admin/contact', contactAdminRoutes);
  app.use('/api/admin/faqs', faqAdminRoutes);
  app.use('/api/admin/analytics', analyticsAdminRoutes);
  app.use('/api/admin/users', adminUserRoutes);
  app.use('/api/faqs', faqsAdminCompatRoutes);

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
  app.use('/api/public/contact', publicContactRoutes);
  app.use('/api/public/faqs', publicFaqRoutes);
  app.use('/api/v1/contact', publicContactRoutes);
  app.use('/api/v1/faqs', publicFaqRoutes);
  app.use('/api/v1/admin', adminAuthRoutes);
  app.use('/api/v1/admin/contact', contactAdminRoutes);
  app.use('/api/v1/admin/faqs', faqAdminRoutes);
  app.use('/api/analytics', analyticsRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API route not found.',
    });
  });

  app.get('/robots.txt', (req, res) => {
    try {
      res.type('text/plain').send(buildRobotsTxt());
    } catch (error) {
      res.status(500).type('text/plain').send('User-agent: *\nDisallow: /\n');
    }
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      res.type('application/xml').send(await buildSitemapXml());
    } catch (error) {
      console.error('Sitemap generation failed:', error.message);
      res.status(503).type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
  });

  app.get(/.*/, redirectCanonicalPublicPath);

  app.get('/updates', redirectTo('/news'));
  app.get('/history', redirectTo('/about/history'));
  app.get('/about-nyakrom/leadership-governance', redirectTo('/about/leadership-governance'));
  app.get('/obituary/:slug', (req, res) => {
    res.redirect(301, `/obituaries/${encodeURIComponent(req.params.slug)}`);
  });

  if (hasAdminBuild) {
    app.use(
      '/admin',
      express.static(frontendPaths.adminDistDir, {
        index: false,
        redirect: false,
      })
    );
  }

  app.get(/^\/admin(?:\/.*)?$/, (req, res, next) => {
    if (!hasAdminBuild || req.method !== 'GET' || !prefersHtml(req) || hasFileExtension(req.path)) {
      return next();
    }

    return sendAdminIndex(res, adminIndexPath);
  });

  if (hasPublicBuild) {
    app.use(
      express.static(frontendPaths.publicDistDir, {
        index: false,
        redirect: false,
      })
    );
  }

  app.get(/.*/, (req, res, next) => {
    if (!hasPublicBuild || req.method !== 'GET' || !prefersHtml(req) || hasFileExtension(req.path)) {
      return next();
    }

    if (
      req.path.startsWith('/api/') ||
      req.path === '/api' ||
      req.path.startsWith('/admin') ||
      req.path.startsWith('/uploads/')
    ) {
      return next();
    }

    return sendSeoHtml(req, res, getHtmlTemplate);
  });

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

  return app;
};

const installRuntimeLogging = () => {
  if (!process.listenerCount('unhandledRejection')) {
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled promise rejection:', reason);
    });
  }

  if (!process.listenerCount('uncaughtException')) {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
    });
  }
};

const installSignalHandlers = (server) => {
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received. Shutting down unified runtime...`);

    await new Promise((resolve) => {
      server.close((error) => {
        if (error) {
          console.error('HTTP server close failed:', error);
        }
        resolve();
      });
    });

    try {
      await pool.end();
    } catch (error) {
      console.error('Database pool shutdown failed:', error);
    }
  };

  const handleSigint = () => {
    shutdown('SIGINT').finally(() => {
      process.exit(0);
    });
  };

  const handleSigterm = () => {
    shutdown('SIGTERM').finally(() => {
      process.exit(0);
    });
  };

  process.once('SIGINT', handleSigint);
  process.once('SIGTERM', handleSigterm);

  server.once('close', () => {
    process.removeListener('SIGINT', handleSigint);
    process.removeListener('SIGTERM', handleSigterm);
  });
};

const startServer = async (app = createApp(), options = {}) => {
  validateRuntimeEnv();
  installRuntimeLogging();

  const frontendPaths = buildFrontendPaths(options);
  assertUnifiedBuildExists(frontendPaths);

  const port = resolveServerPort();
  const host = options.host || process.env.HOST || '0.0.0.0';
  const connectToDatabase = options.connectToDatabase || connectDB;

  await connectToDatabase();

  return await new Promise((resolve, reject) => {
    const server = app.listen(port, host);

    server.once('error', (error) => {
      logStartupFailure(error, port);
      reject(error);
    });

    server.once('listening', () => {
      console.log(`Server is running on http://localhost:${port}`);
      installSignalHandlers(server);
      resolve(server);
    });

    server.once('close', () => {
      console.log('HTTP server closed.');
    });
  });
};

module.exports = {
  assertUnifiedBuildExists,
  buildPortInUseMessage,
  buildFrontendPaths,
  createApp,
  logStartupFailure,
  resolveServerPort,
  startServer,
};
