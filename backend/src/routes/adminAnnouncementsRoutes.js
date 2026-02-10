const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/authMiddleware');
const uploadImage = require('../middleware/uploadMiddleware');
const adminAnnouncementsController = require('../controllers/adminAnnouncementsController');

router.get('/', requireAdminAuth, adminAnnouncementsController.getAllAnnouncements);
router.post(
  '/',
  requireAdminAuth,
  uploadImage.single('flyer_image'),
  adminAnnouncementsController.createAnnouncement
);
router.get('/:id', requireAdminAuth, adminAnnouncementsController.getSingleAnnouncement);
router.put(
  '/:id',
  requireAdminAuth,
  uploadImage.single('flyer_image'),
  adminAnnouncementsController.updateAnnouncement
);
router.delete('/:id', requireAdminAuth, adminAnnouncementsController.deleteAnnouncement);

module.exports = router;
