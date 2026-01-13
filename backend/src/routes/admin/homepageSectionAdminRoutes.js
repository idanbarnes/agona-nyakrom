const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const homepageSectionAdminController = require('../../controllers/admin/homepageSectionAdminController');

// Admin CRUD routes for Homepage Sections
router.post(
  '/create',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  homepageSectionAdminController.createHomepageSection
);
router.post(
  '/',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  homepageSectionAdminController.createHomepageSection
);
router.put(
  '/update/:id',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  homepageSectionAdminController.updateHomepageSection
);
router.put(
  '/:id',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  homepageSectionAdminController.updateHomepageSection
);
router.delete('/delete/:id', requireAdminAuth, homepageSectionAdminController.deleteHomepageSection);
router.delete('/:id', requireAdminAuth, homepageSectionAdminController.deleteHomepageSection);
router.get('/all', requireAdminAuth, homepageSectionAdminController.getAllHomepageSections);
router.get('/single/:id', requireAdminAuth, homepageSectionAdminController.getSingleHomepageSection);
router.get('/', requireAdminAuth, homepageSectionAdminController.getAllHomepageSections);
router.get('/:id', requireAdminAuth, homepageSectionAdminController.getSingleHomepageSection);

module.exports = router;
