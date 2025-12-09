// Entry point for the Agona Nyakrom backend
require('dotenv').config();
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


const app = express();

// Global middleware
app.use(cors()); // Allow cross-origin requests (frontend and admin panel)
app.use(express.json()); // Parse incoming JSON payloads

app.use('/api/news', newsRoutes);
app.use('/api/obituaries', obituaryRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/asafo-companies', asafoRoutes);
app.use('/api/landmarks', landMarkRoutes);
app.use('/api/hall-of-fame', hallOfFameRoutes);
app.use('/api', settingsRoutes);


// Health check endpoint to verify server availability
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running' });
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
