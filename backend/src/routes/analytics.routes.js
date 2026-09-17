const express = require('express');
const { getAnalytics } = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/analytics - Get user-isolated analytics
router.get('/', authenticateToken, getAnalytics);

module.exports = router;
