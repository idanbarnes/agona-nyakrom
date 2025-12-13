const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const asafoAdminController = require('../../controllers/admin/asafoAdminController');

// Admin CRUD routes for Asafo Companies
router.post('/create', requireAdminAuth, uploadMiddleware.single('image'), asafoAdminController.createAsafo);
router.put('/update/:id', requireAdminAuth, uploadMiddleware.single('image'), asafoAdminController.updateAsafo);
router.delete('/delete/:id', requireAdminAuth, asafoAdminController.deleteAsafo);
router.get('/all', requireAdminAuth, asafoAdminController.getAllAsafo);
router.get('/single/:id', requireAdminAuth, asafoAdminController.getSingleAsafo);

module.exports = router;
