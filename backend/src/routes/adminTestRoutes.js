const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/authMiddleware');

router.get('/ping', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'You are an authenticated admin',
    admin: req.admin,
  });
});

module.exports = router;
