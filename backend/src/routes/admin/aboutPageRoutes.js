const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const aboutPageAdminController = require('../../controllers/admin/aboutPageAdminController');

router.get('/:slug', requireAdminAuth, aboutPageAdminController.getAboutPage);
router.put('/:slug', requireAdminAuth, aboutPageAdminController.upsertAboutPage);
router.patch('/:slug/publish', requireAdminAuth, aboutPageAdminController.togglePublish);
router.post('/upload-image', requireAdminAuth, uploadMiddleware.single('image'), aboutPageAdminController.uploadAboutImage);

module.exports = router;
