const crypto = require('crypto');

/**
 * Hashes raw IP address using SHA-256 and IP_HASH_SECRET.
 * Ensures raw IP address is NEVER saved to DB or exposed.
 *
 * @param {string} rawIp
 * @returns {string} SHA-256 hex hash
 */
const hashIp = (rawIp) => {
  const ip = rawIp || '0.0.0.0';
  const secret =
    process.env.IP_HASH_SECRET || 'default_dev_ip_hash_salt_key_32bytes';

  return crypto
    .createHmac('sha256', secret)
    .update(ip)
    .digest('hex');
};

/**
 * Normalizes User-Agent header into EXACTLY 'Mobile', 'Tablet', or 'Desktop'.
 *
 * @param {string} userAgent
 * @returns {'Mobile' | 'Tablet' | 'Desktop'}
 */
const detectDeviceType = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'Desktop';
  }

  const ua = userAgent.toLowerCase();

  // Check Tablet first (iPad, Android tablet, etc.)
  if (
    /ipad|tablet|playbook|silk/i.test(ua) ||
    (/android/i.test(ua) && !/mobile/i.test(ua))
  ) {
    return 'Tablet';
  }

  // Check Mobile (iPhone, Android mobile, Windows Phone, iPod, etc.)
  if (
    /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|mobile/i.test(
      ua
    )
  ) {
    return 'Mobile';
  }

  return 'Desktop';
};

/**
 * Extracts normalized HTTP referrer header from request.
 *
 * @param {import('express').Request} req
 * @returns {string} Referrer domain or 'Direct'
 */
const extractReferrer = (req) => {
  const ref = req.get('referer') || req.get('referrer');
  if (!ref) {
    return 'Direct';
  }

  try {
    const parsed = new URL(ref);
    return parsed.hostname || ref;
  } catch (err) {
    return ref.trim() || 'Direct';
  }
};

/**
 * Extracts raw client IP address safely from Express request.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

module.exports = {
  hashIp,
  detectDeviceType,
  extractReferrer,
  getClientIp,
};
