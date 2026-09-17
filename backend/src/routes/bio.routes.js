const express = require('express');
const {
  getMyBio,
  updateMyBio,
  getPublicBio,
} = require('../controllers/bio.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protected Bio Profile Endpoints
router.get('/me', authenticateToken, getMyBio);
router.put('/me', authenticateToken, updateMyBio);

// Public Bio Profile Endpoint (Unauthenticated)
router.get('/:username', getPublicBio);

module.exports = router;
