const express = require('express');
const router = express.Router();
const clanController = require('../controllers/clanController');

// Public read-only routes (mount at /api/clans)
router.get('/', clanController.getAllClans);
router.get('/:slug', clanController.getSingleClan);

module.exports = router;
