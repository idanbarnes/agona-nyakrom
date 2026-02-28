const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/public/contactController');

router.get('/', contactController.getPublicFaqs);

module.exports = router;
