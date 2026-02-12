const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const leadersAdminController = require('../../controllers/admin/leadersAdminController');

router.get('/', requireAdminAuth, leadersAdminController.listLeaders);
router.post('/', requireAdminAuth, uploadMiddleware.single('photo'), leadersAdminController.createLeader);
router.put('/:id', requireAdminAuth, uploadMiddleware.single('photo'), leadersAdminController.updateLeader);
router.delete('/:id', requireAdminAuth, leadersAdminController.deleteLeader);

module.exports = router;
