const express = require('express');
const router = express.Router();
const asafoController = require('../controllers/asafoController');

// Public read-only routes
router.get('/', asafoController.getAllAsafoCompanies);
router.get('/:slug', asafoController.getAsafoCompanyBySlug);

module.exports = router;
