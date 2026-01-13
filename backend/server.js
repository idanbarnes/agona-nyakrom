// Entry point for the Agona Nyakrom backend
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');

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
const historyPageAdminRoutes = require('./src/routes/admin/historyPageRoutes');

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
app.use('/api/admin/news', newsAdminRoutes);
app.use('/api/admin/obituaries', obituaryAdminRoutes);
app.use('/api/admin/clans', clanAdminRoutes);
app.use('/api/admin/asafo-companies', asafoAdminRoutes);
app.use('/api/admin/hall-of-fame', hallOfFameAdminRoutes);
app.use('/api/admin/landmarks', landmarkAdminRoutes);
app.use('/api/admin/carousel', carouselAdminRoutes);
app.use('/api/admin/global-settings', adminGlobalSettingsRoutes);
app.use('/api/admin/homepage-sections', homepageSectionAdminRoutes);
app.use('/api/admin/history', historyPageAdminRoutes);

//for handling public endpoints (registerd)
app.use('/api/public/news', publicNewsRoutes);
app.use('/api/public/obituaries', publicObituaryRoutes);
app.use('/api/public/clans', publicClansRoutes);
app.use('/api/public/asafo-companies', publicAsafoRoutes);
app.use('/api/public/hall-of-fame', publicHallOfFameRoutes);
app.use('/api/public/landmarks', publicLandmarkRoutes);
app.use('/api/public/carousel', publicCarouselRoutes);
app.use('/api/public/global-settings', publicGlobalSettingsRoutes);
app.use('/api/public/homepage', publicHomepageRoutes);
app.use('/api/public/history', publicHistoryPageRoutes);


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
