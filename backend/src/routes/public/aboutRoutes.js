const express = require('express');
const router = express.Router();
const aboutController = require('../../controllers/public/aboutController');

router.get('/:slug', aboutController.getPublicAboutPage);

module.exports = router;
