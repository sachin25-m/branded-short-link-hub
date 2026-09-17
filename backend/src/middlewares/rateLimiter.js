const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting configuration for authentication endpoints.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 60, // Limit each IP to 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate Limiting configuration for link creation endpoint.
 */
const linkCreateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 60, // Limit each IP to 60 creations per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many short links created from this IP. Please try again later.',
  },
});

/**
 * Rate Limiting configuration for redirection endpoint.
 */
const redirectRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 120, // Limit each IP to 120 redirects per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many redirect requests. Please try again in a minute.',
  },
});

module.exports = {
  authRateLimiter,
  linkCreateRateLimiter,
  redirectRateLimiter,
};
