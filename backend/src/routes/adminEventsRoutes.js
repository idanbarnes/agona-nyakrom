const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/authMiddleware');
const uploadImage = require('../middleware/uploadMiddleware');
const adminEventsController = require('../controllers/adminEventsController');

router.get('/', requireAdminAuth, adminEventsController.getAllEvents);
router.post('/', requireAdminAuth, uploadImage.single('flyer_image'), adminEventsController.createEvent);
router.get('/:id', requireAdminAuth, adminEventsController.getSingleEvent);
router.put('/:id', requireAdminAuth, uploadImage.single('flyer_image'), adminEventsController.updateEvent);
router.delete('/:id', requireAdminAuth, adminEventsController.deleteEvent);

module.exports = router;
