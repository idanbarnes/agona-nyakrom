const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const historyPageController = require('../../controllers/admin/historyPageController');

// Admin routes for the single history page record
router.get('/', requireAdminAuth, historyPageController.getHistoryPage);
router.put(
  '/',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  historyPageController.upsertHistoryPage
);

module.exports = router;
