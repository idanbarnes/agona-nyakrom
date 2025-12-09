const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Public login route
router.post('/login', adminAuthController.login);

// Protected route (requires auth middleware to populate req.admin)
router.get('/me',requireAdminAuth, adminAuthController.me);

module.exports = router;
