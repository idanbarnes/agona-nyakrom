const express = require('express');
const router = express.Router();
const globalSettingsController = require('../../controllers/public/globalSettingsController');

// Public route for global settings
router.get('/', globalSettingsController.getGlobalSettings);

module.exports = router;
