const express = require('express');
const router = express.Router();
const leadersController = require('../../controllers/public/leadersController');

router.get('/', leadersController.getPublishedLeaders);
router.get('/:slug', leadersController.getPublishedLeaderBySlug);

module.exports = router;
