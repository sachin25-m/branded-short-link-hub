const crypto = require('crypto');

const ALPHANUMERIC_CHARS =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates an unguessable, cryptographically secure short code of EXACTLY 6 characters.
 *
 * @param {number} length Default is 6 characters as required by company brief
 * @returns {string}
 */
const generateShortCode = (length = 6) => {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = bytes[i] % ALPHANUMERIC_CHARS.length;
    result += ALPHANUMERIC_CHARS[randomIndex];
  }
  return result;
};

module.exports = {
  generateShortCode,
};
