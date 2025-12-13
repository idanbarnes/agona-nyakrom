const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadImage = require('../../middleware/uploadMiddleware');
const newsAdminController = require('../../controllers/admin/newsAdminController');

// Admin CRUD routes for News
router.post('/create', requireAdminAuth, uploadImage.single('image'), newsAdminController.createNews);
router.put('/update/:id', requireAdminAuth, uploadImage.single('image'), newsAdminController.updateNews);
router.delete('/delete/:id', requireAdminAuth, newsAdminController.deleteNews);
router.get('/all', requireAdminAuth, newsAdminController.getAllNews);
router.get('/single/:id', requireAdminAuth, newsAdminController.getSingleNews);

module.exports = router;