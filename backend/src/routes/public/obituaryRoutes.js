const express = require('express');
const router = express.Router();
const obituaryController = require('../../controllers/public/obituaryController');

// Public read-only routes for published obituaries
router.get('/', obituaryController.getAllPublishedObituaries);
router.get('/:slug', obituaryController.getPublishedObituaryBySlug);

module.exports = router;
