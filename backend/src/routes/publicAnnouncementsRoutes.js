const express = require('express');
const router = express.Router();
const publicAnnouncementsController = require('../controllers/publicAnnouncementsController');

router.get('/', publicAnnouncementsController.getPublicAnnouncements);
router.get('/:slug', publicAnnouncementsController.getPublicAnnouncementBySlug);

module.exports = router;
