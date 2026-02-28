const express = require('express');
const { requireAdminAuth } = require('../middleware/authMiddleware');
const faqAdminController = require('../controllers/admin/faqAdminController');

const router = express.Router();

// Compatibility routes for FAQ admin management expected by some CMS clients.
router.get('/admin', requireAdminAuth, faqAdminController.getAdminFaqs);
router.post('/', requireAdminAuth, faqAdminController.createAdminFaq);
router.get('/:id', requireAdminAuth, faqAdminController.getAdminFaqById);
router.put('/:id', requireAdminAuth, faqAdminController.updateAdminFaq);
router.delete('/:id', requireAdminAuth, faqAdminController.deleteAdminFaq);
router.patch('/reorder', requireAdminAuth, faqAdminController.reorderAdminFaqs);
router.patch('/:id/toggle', requireAdminAuth, faqAdminController.toggleAdminFaqStatus);
router.post('/bulk-delete', requireAdminAuth, faqAdminController.bulkDeleteAdminFaqs);
router.post('/bulk-activate', requireAdminAuth, faqAdminController.bulkActivateAdminFaqs);
router.post('/bulk-deactivate', requireAdminAuth, faqAdminController.bulkDeactivateAdminFaqs);

module.exports = router;
