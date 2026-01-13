const express = require('express');
const router = express.Router();
const historyPageController = require('../../controllers/public/historyPageController');

// Public route for the published history page
router.get('/', historyPageController.getPublishedHistoryPage);

module.exports = router;
