const express = require('express');
const router = express.Router();
const clanController = require('../../controllers/public/clanController');

// Public read-only routes for family clans
router.get('/', clanController.getAllPublishedClans);
router.get('/:slug', clanController.getPublishedClanBySlug);

module.exports = router;
