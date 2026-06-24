const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { analyticsRateLimit } = require('../middleware/analyticsRateLimit');

const router = express.Router();

router.post('/events', analyticsRateLimit, analyticsController.ingestEvent);

module.exports = router;
