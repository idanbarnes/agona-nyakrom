const express = require('express');
const router = express.Router();
const carouselController = require('../../controllers/public/carouselController');

// Public read-only routes for carousel slides
router.get('/', carouselController.getPublishedCarouselSlides);

module.exports = router;
