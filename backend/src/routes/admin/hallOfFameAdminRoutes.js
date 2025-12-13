const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const hallOfFameAdminController = require('../../controllers/admin/hallOfFameAdminController');

// Admin CRUD routes for Hall of Fame
router.post('/create', requireAdminAuth, uploadMiddleware.single('image'), hallOfFameAdminController.createHallOfFame);
router.get('/all', requireAdminAuth, hallOfFameAdminController.getAllHallOfFame);
router.get('/single/:id', requireAdminAuth, hallOfFameAdminController.getSingleHallOfFame);
router.put('/update/:id', requireAdminAuth, uploadMiddleware.single('image'), hallOfFameAdminController.updateHallOfFame);
router.delete('/delete/:id', requireAdminAuth, hallOfFameAdminController.deleteHallOfFame);

module.exports = router;
