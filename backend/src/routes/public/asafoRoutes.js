const express = require('express');
const router = express.Router();
const asafoController = require('../../controllers/public/asafoController');

// Public read-only routes for Asafo companies
router.get('/', asafoController.getAllPublishedAsafo);
router.get('/:slug', asafoController.getPublishedAsafoBySlug);

module.exports = router;
