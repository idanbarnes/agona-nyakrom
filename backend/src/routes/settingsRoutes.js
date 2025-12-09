const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Public read-only routes
router.get('/history', settingsController.getHistory);
router.get('/homepage-settings', settingsController.getHomepageSettings);
router.get('/global-settings', settingsController.getGlobalSettings);

module.exports = router;
