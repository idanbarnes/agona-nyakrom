const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/public/contactController');

router.get('/', contactController.getPublicContact);
router.get('/sections', contactController.getPublicContactSections);

module.exports = router;
