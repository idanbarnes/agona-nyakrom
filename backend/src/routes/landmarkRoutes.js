const express = require('express');
const router = express.Router();
const landmarkController = require('../controllers/landmarkController');

// Public read-only routes
router.get('/', landmarkController.getAllLandmarks);
router.get('/:slug', landmarkController.getLandmarkBySlug);

module.exports = router;
