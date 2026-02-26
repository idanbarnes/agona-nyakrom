const express = require('express');
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const previewController = require('../../controllers/admin/adminPreviewController');

const router = express.Router();

router.get('/preview/resources', requireAdminAuth, previewController.listResources);
router.get('/:resource/:id/preview', requireAdminAuth, previewController.getPreview);

module.exports = router;
