const express = require('express');
const {
  createLink,
  redirectLink,
  getUserLinks,
  deleteLink,
} = require('../controllers/link.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  linkCreateRateLimiter,
  redirectRateLimiter,
} = require('../middlewares/rateLimiter');

const router = express.Router();

// API Links endpoints
router.post('/links', authenticateToken, linkCreateRateLimiter, createLink);
router.get('/links', authenticateToken, getUserLinks);
router.delete('/links/:id', authenticateToken, deleteLink);

// Redirection Engine endpoint (Mounted at /r/:shortCode)
router.get('/r/:shortCode', redirectRateLimiter, redirectLink);

module.exports = router;
