const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');

// Simple protected check to validate admin routing and auth middleware
router.get('/check', requireAdminAuth, (req, res) => {
  res.json({ success: true, message: 'Admin routes working', admin: req.admin });
});

module.exports = router;
