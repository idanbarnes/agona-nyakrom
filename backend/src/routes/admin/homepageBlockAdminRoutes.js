const express = require('express');
const router = express.Router();
const homepageBlockAdminController = require('../../controllers/admin/homepageBlockAdminController');
const uploadImage = require('../../middleware/uploadMiddleware');
const { requireAdminAuth } = require('../../middleware/authMiddleware');

router.post(
  '/',
  requireAdminAuth,
  uploadImage.single('image'),
  homepageBlockAdminController.createHomepageBlock
);
router.put(
  '/:id',
  requireAdminAuth,
  uploadImage.single('image'),
  homepageBlockAdminController.updateHomepageBlock
);
router.delete('/:id', requireAdminAuth, homepageBlockAdminController.deleteHomepageBlock);
router.get('/', requireAdminAuth, homepageBlockAdminController.getAllHomepageBlocks);
router.get('/:id', requireAdminAuth, homepageBlockAdminController.getSingleHomepageBlock);

module.exports = router;
