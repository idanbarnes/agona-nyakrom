const express = require('express');
const adminUserController = require('../../controllers/admin/adminUserController');
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const { requireMasterAdmin } = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/', requireAdminAuth, requireMasterAdmin, adminUserController.listAdmins);
router.post('/', requireAdminAuth, requireMasterAdmin, adminUserController.createAdmin);
router.put('/:id', requireAdminAuth, requireMasterAdmin, adminUserController.updateAdmin);
router.delete('/:id', requireAdminAuth, requireMasterAdmin, adminUserController.deleteAdmin);

module.exports = router;
