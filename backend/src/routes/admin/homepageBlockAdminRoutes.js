const express = require('express');
const router = express.Router();
const homepageBlockAdminController = require('../../controllers/admin/homepageBlockAdminController');
const uploadImage = require('../../middleware/uploadMiddleware');
const { requireAdminAuth } = require('../../middleware/authMiddleware');

const homepageUploadFields = uploadImage.any();

const HOMEPAGE_ALLOWED_UPLOAD_FIELDS = [
  /^image$/,
  /^media_image_file$/,
  /^who_we_are_gallery_image_[0-9]+$/,
  /^who_we_are_gallery_[0-9]+_image$/,
];

const validateHomepageUploadFields = (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];

  const invalidFile = files.find((file) => {
    const fieldName = String(file?.fieldname || '');
    return !HOMEPAGE_ALLOWED_UPLOAD_FIELDS.some((pattern) => pattern.test(fieldName));
  });

  if (invalidFile) {
    return res.status(400).json({
      success: false,
      message: `Unexpected field: ${invalidFile.fieldname}`,
    });
  }

  return next();
};

router.post(
  '/',
  requireAdminAuth,
  homepageUploadFields,
  validateHomepageUploadFields,
  homepageBlockAdminController.createHomepageBlock
);
router.put(
  '/:id',
  requireAdminAuth,
  homepageUploadFields,
  validateHomepageUploadFields,
  homepageBlockAdminController.updateHomepageBlock
);
router.delete('/:id', requireAdminAuth, homepageBlockAdminController.deleteHomepageBlock);
router.get('/', requireAdminAuth, homepageBlockAdminController.getAllHomepageBlocks);
router.get('/:id', requireAdminAuth, homepageBlockAdminController.getSingleHomepageBlock);

module.exports = router;
