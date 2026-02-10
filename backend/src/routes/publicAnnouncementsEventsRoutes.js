const express = require('express');
const router = express.Router();
const publicAnnouncementsEventsController = require('../controllers/publicAnnouncementsEventsController');

router.get('/', publicAnnouncementsEventsController.getPublicAnnouncementsEvents);

module.exports = router;
