const express = require('express');
const router = express.Router();
const publicEventsController = require('../controllers/publicEventsController');

router.get('/', publicEventsController.getPublicEvents);
router.get('/:slug', publicEventsController.getPublicEventBySlug);

module.exports = router;
