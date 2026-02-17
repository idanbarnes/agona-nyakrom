const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const asafoAdminController = require('../../controllers/admin/asafoAdminController');

router.get('/', requireAdminAuth, asafoAdminController.listAsafoEntries);
router.post('/', requireAdminAuth, uploadMiddleware.single('image'), asafoAdminController.createAsafoEntry);
router.put('/:id', requireAdminAuth, uploadMiddleware.single('image'), asafoAdminController.updateAsafoEntry);
router.delete('/:id', requireAdminAuth, asafoAdminController.deleteAsafoEntry);
router.get('/:id', requireAdminAuth, asafoAdminController.getSingleAsafoEntry);
router.post('/upload-image', requireAdminAuth, uploadMiddleware.single('image'), asafoAdminController.uploadAsafoImage);

// Backward-compatible endpoints
router.post('/create', requireAdminAuth, uploadMiddleware.single('image'), asafoAdminController.createAsafo);
router.put('/update/:id', requireAdminAuth, uploadMiddleware.single('image'), asafoAdminController.updateAsafo);
router.delete('/delete/:id', requireAdminAuth, asafoAdminController.deleteAsafo);
router.get('/all', requireAdminAuth, asafoAdminController.getAllAsafo);
router.get('/single/:id', requireAdminAuth, asafoAdminController.getSingleAsafo);

module.exports = router;
