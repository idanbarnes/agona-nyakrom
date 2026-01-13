const express = require('express');
const router = express.Router();
const landmarkController = require('../../controllers/public/landmarkController');

// Public read-only routes for landmarks
router.get('/', landmarkController.getAllPublishedLandmarks);
router.get('/:slug', landmarkController.getPublishedLandmarkBySlug);

module.exports = router;
