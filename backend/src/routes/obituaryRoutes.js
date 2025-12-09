const express = require('express');
const router = express.Router();
const obituaryController = require('../controllers/obituaryController');

// Public read-only routes (mount at /api/obituaries)
router.get('/', obituaryController.getAllObituaries);
router.get('/:slug', obituaryController.getSingleObituary);

module.exports = router;
