const express = require('express');
const analyticsController = require('../../controllers/analyticsController');
const { requireAdminAuth } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/report', requireAdminAuth, analyticsController.getReport);
router.post('/cleanup', requireAdminAuth, analyticsController.cleanup);

module.exports = router;
