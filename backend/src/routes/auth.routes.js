const express = require('express');
const {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Authentication Endpoints
router.post('/signup', authRateLimiter, signup);
router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/login', authRateLimiter, login);
router.post('/refresh', authRateLimiter, refresh);
router.post('/logout', logout);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

// Protected Auth Endpoints
router.get('/me', authenticateToken, getMe);

module.exports = router;
