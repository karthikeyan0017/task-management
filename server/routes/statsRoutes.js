const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/statsController');
const { optionalAuth } = require('../middleware/auth');

router.get('/overview', optionalAuth, StatsController.getOverview);
router.get('/activities', optionalAuth, StatsController.getActivities);

module.exports = router;
