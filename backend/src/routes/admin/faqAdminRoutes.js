const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const faqAdminController = require('../../controllers/admin/faqAdminController');

router.get('/', requireAdminAuth, faqAdminController.getAdminFaqs);
router.post('/', requireAdminAuth, faqAdminController.createAdminFaq);
router.post('/reorder', requireAdminAuth, faqAdminController.reorderAdminFaqs);
router.patch('/reorder', requireAdminAuth, faqAdminController.reorderAdminFaqs);
router.post('/bulk', requireAdminAuth, faqAdminController.bulkAdminFaqAction);
router.post('/bulk-delete', requireAdminAuth, faqAdminController.bulkDeleteAdminFaqs);
router.post('/bulk-activate', requireAdminAuth, faqAdminController.bulkActivateAdminFaqs);
router.post('/bulk-deactivate', requireAdminAuth, faqAdminController.bulkDeactivateAdminFaqs);
router.get('/:id', requireAdminAuth, faqAdminController.getAdminFaqById);
router.put('/:id', requireAdminAuth, faqAdminController.updateAdminFaq);
router.delete('/:id', requireAdminAuth, faqAdminController.deleteAdminFaq);
router.patch('/:id/toggle', requireAdminAuth, faqAdminController.toggleAdminFaqStatus);

module.exports = router;
