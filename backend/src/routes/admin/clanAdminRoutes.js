const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const clanAdminController = require('../../controllers/admin/clanAdminController');

// Admin CRUD routes for Family Clans
router.post('/create', requireAdminAuth, uploadMiddleware.single('image'), clanAdminController.createClan);
router.put('/update/:id', requireAdminAuth, uploadMiddleware.single('image'), clanAdminController.updateClan);
router.delete('/delete/:id', requireAdminAuth, clanAdminController.deleteClan);
router.get('/all', requireAdminAuth, clanAdminController.getAllClans);
router.get('/single/:id', requireAdminAuth, clanAdminController.getSingleClan);

module.exports = router;
