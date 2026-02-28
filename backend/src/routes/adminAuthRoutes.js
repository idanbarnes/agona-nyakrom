const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { adminLoginRateLimit } = require('../middleware/adminLoginRateLimit');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Public login route
router.post('/login', adminLoginRateLimit, adminAuthController.login);
router.post('/logout', requireAdminAuth, adminAuthController.logout);

// Protected route (requires auth middleware to populate req.admin)
router.get('/me', requireAdminAuth, adminAuthController.me);
router.get('/profile', requireAdminAuth, adminAuthController.me);

module.exports = router;
