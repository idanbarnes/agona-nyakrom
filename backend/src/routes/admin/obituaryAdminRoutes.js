const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const obituaryAdminController = require('../../controllers/admin/obituaryAdminController');

// Admin CRUD routes for Obituaries
router.post('/create', requireAdminAuth, uploadMiddleware.single('image'), obituaryAdminController.createObituary);
router.put('/update/:id', requireAdminAuth, uploadMiddleware.single('image'), obituaryAdminController.updateObituary);
router.delete('/delete/:id', requireAdminAuth, obituaryAdminController.deleteObituary);
router.get('/all', requireAdminAuth, obituaryAdminController.getAllObituaries);
router.get('/single/:id', requireAdminAuth, obituaryAdminController.getSingleObituary);

module.exports = router;
