const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const globalSettingsController = require('../../controllers/admin/globalSettingsController');

// Admin routes for global site settings
router.get('/', requireAdminAuth, globalSettingsController.getGlobalSettings);
router.put('/', requireAdminAuth, globalSettingsController.updateGlobalSettings);

module.exports = router;
