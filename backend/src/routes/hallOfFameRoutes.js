const express = require('express');
const router = express.Router();
const hallOfFameController = require('../controllers/hallOfFameController');

// Public read-only routes
router.get('/', hallOfFameController.getAllHeroes);
router.get('/:slugOrId', hallOfFameController.getHeroBySlug);

module.exports = router;
