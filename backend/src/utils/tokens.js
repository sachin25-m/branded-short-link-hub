const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate Access Token (EXACTLY 15 minutes lifetime).
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generate Refresh Token (EXACTLY 7 days lifetime).
 */
const generateRefreshToken = (userId, familyId) => {
  return jwt.sign(
    {
      userId: userId.toString(),
      familyId,
      jti: crypto.randomUUID(),
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Hash raw token strings for secure DB storage using SHA-256.
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate cryptographically secure random token string.
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Cookie security options for Refresh Token httpOnly cookie.
 */
const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
};

/**
 * Options for clearing cookie without maxAge deprecation warning.
 */
const getClearCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateRandomToken,
  getRefreshCookieOptions,
  getClearCookieOptions,
};
