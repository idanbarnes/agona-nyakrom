const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const landmarkAdminController = require('../../controllers/admin/landmarkAdminController');

// Admin CRUD routes for landmarks
router.post(
  '/create',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  landmarkAdminController.createLandmark
);
router.post(
  '/',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  landmarkAdminController.createLandmark
);
router.get('/all', requireAdminAuth, landmarkAdminController.getAllLandmarks);
router.get('/single/:id', requireAdminAuth, landmarkAdminController.getSingleLandmark);
router.put(
  '/update/:id',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  landmarkAdminController.updateLandmark
);
router.put(
  '/:id',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  landmarkAdminController.updateLandmark
);
router.delete('/delete/:id', requireAdminAuth, landmarkAdminController.deleteLandmark);
router.delete('/:id', requireAdminAuth, landmarkAdminController.deleteLandmark);
router.get('/', requireAdminAuth, landmarkAdminController.getAllLandmarks);
router.get('/:id', requireAdminAuth, landmarkAdminController.getSingleLandmark);

module.exports = router;
