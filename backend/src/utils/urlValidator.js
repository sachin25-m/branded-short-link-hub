/**
 * Validates whether a given string is a valid HTTP or HTTPS URL.
 * Rejects empty strings, malformed syntax, and non-HTTP(S) schemes.
 *
 * @param {string} urlString
 * @returns {boolean}
 */
const isValidUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  const trimmed = urlString.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmed);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

module.exports = {
  isValidUrl,
};
