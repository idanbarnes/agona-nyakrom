const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const contactAdminController = require('../../controllers/admin/contactAdminController');

router.get('/', requireAdminAuth, contactAdminController.getAdminContact);
router.put('/', requireAdminAuth, contactAdminController.updateAdminContact);
router.patch('/emails', requireAdminAuth, contactAdminController.patchEmails);
router.patch('/phones', requireAdminAuth, contactAdminController.patchPhones);
router.patch('/address', requireAdminAuth, contactAdminController.patchAddress);
router.patch('/hours', requireAdminAuth, contactAdminController.patchOfficeHours);

module.exports = router;
