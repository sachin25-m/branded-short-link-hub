const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  'dev_jwt_access_secret_super_secure_key_32bytes_min!';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'dev_jwt_refresh_secret_super_secure_key_32bytes_min!';

/**
 * Generate Access Token (EXACTLY 15 minutes lifetime).
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    JWT_ACCESS_SECRET,
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
    JWT_REFRESH_SECRET,
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
