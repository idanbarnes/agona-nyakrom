const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Public read-only routes (mount at /api/news)
router.get('/', newsController.getAllNews);
router.get('/:slug', newsController.getSingleNews);

module.exports = router;
