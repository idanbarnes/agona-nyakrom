const express = require('express');
const router = express.Router();
const homepageController = require('../../controllers/public/homepageController');

// Public route for homepage payload
router.get('/', homepageController.getHomepage);

module.exports = router;
