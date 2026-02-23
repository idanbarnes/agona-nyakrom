const express = require('express');
const router = express.Router();
const hallOfFameController = require('../../controllers/public/hallOfFameController');

// Public read-only routes for Hall of Fame
router.get('/', hallOfFameController.getAllPublishedHallOfFame);
router.get('/:slugOrId', hallOfFameController.getPublishedHallOfFameBySlug);

module.exports = router;
