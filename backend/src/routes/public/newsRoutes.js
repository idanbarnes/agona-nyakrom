const express = require('express');
const router = express.Router();
const newsController = require('../../controllers/public/newsController');

// Public read-only routes for published news
router.get('/', newsController.getAllPublishedNews);
router.get('/preview', newsController.getPreviewNewsByToken);
router.get('/:slug', newsController.getPublishedNewsBySlug);

module.exports = router;
