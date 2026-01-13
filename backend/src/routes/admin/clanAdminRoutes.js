const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../../middleware/authMiddleware');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const clanAdminController = require('../../controllers/admin/clanAdminController');
const clanLeaderAdminController = require('../../controllers/admin/clanLeaderAdminController');

// Admin CRUD routes for Family Clans
router.post('/create', requireAdminAuth, uploadMiddleware.single('image'), clanAdminController.createClan);
router.put('/update/:id', requireAdminAuth, uploadMiddleware.single('image'), clanAdminController.updateClan);
router.delete('/delete/:id', requireAdminAuth, clanAdminController.deleteClan);
router.get('/all', requireAdminAuth, clanAdminController.getAllClans);
router.get('/single/:id', requireAdminAuth, clanAdminController.getSingleClan);
router.post(
  '/:clanId/leaders',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  clanLeaderAdminController.createLeader
);
router.put(
  '/:clanId/leaders/:leaderId',
  requireAdminAuth,
  uploadMiddleware.single('image'),
  clanLeaderAdminController.updateLeader
);
router.delete(
  '/:clanId/leaders/:leaderId',
  requireAdminAuth,
  clanLeaderAdminController.deleteLeader
);
router.patch(
  '/:clanId/leaders/reorder',
  requireAdminAuth,
  clanLeaderAdminController.reorderLeaders
);

module.exports = router;
