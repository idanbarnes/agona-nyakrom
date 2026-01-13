const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const carouselAdminController = require('../../controllers/admin/carouselAdminController');

// Admin CRUD routes for carousel slides
router.post(
  '/create',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  carouselAdminController.createCarouselSlide
);
router.get('/all', requireAdminAuth, carouselAdminController.getAllCarouselSlides);
router.get('/single/:id', requireAdminAuth, carouselAdminController.getSingleCarouselSlide);
router.put(
  '/update/:id',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  carouselAdminController.updateCarouselSlide
);
router.delete('/delete/:id', requireAdminAuth, carouselAdminController.deleteCarouselSlide);

module.exports = router;
