const { isValidUrl } = require('./urlValidator');

const RESERVED_USERNAMES = new Set([
  'api',
  'r',
  'auth',
  'health',
  'admin',
  'bio',
  'dashboard',
  'login',
  'signup',
  'verify-email',
  'forgot-password',
  'reset-password',
  'settings',
  'profile',
]);

const ALLOWED_PLATFORMS = new Set([
  'github',
  'linkedin',
  'instagram',
  'x',
  'youtube',
  'facebook',
]);

const ALLOWED_THEMES = new Set([
  'minimal-light',
  'dark-slate',
  'gradient',
]);

/**
 * Validates username format and checks against reserved route names.
 *
 * @param {string} username
 * @returns {{ valid: boolean, error?: string }}
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username must be a non-empty string.' };
  }

  const trimmed = username.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'Username cannot be empty or whitespace.' };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!usernameRegex.test(trimmed)) {
    return {
      valid: false,
      error:
        'Username must be between 3 and 30 characters long and contain only letters, numbers, hyphens, or underscores.',
    };
  }

  if (RESERVED_USERNAMES.has(trimmed)) {
    return {
      valid: false,
      error: `The username '${trimmed}' is a reserved system route and cannot be used.`,
    };
  }

  return { valid: true, normalized: trimmed };
};

/**
 * Validates avatar URL when supplied.
 *
 * @param {string} avatarUrl
 * @returns {{ valid: boolean, error?: string }}
 */
const validateAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.trim()) {
    return { valid: true, url: '' };
  }

  const trimmed = avatarUrl.trim();
  if (!isValidUrl(trimmed)) {
    return {
      valid: false,
      error: 'Avatar URL must be a valid HTTP or HTTPS image URL.',
    };
  }

  return { valid: true, url: trimmed };
};

/**
 * Validates and normalizes structured social links array.
 *
 * @param {Array<{platform: string, url: string}>} links
 * @returns {{ valid: boolean, error?: string, normalized?: Array<{platform: string, url: string}> }}
 */
const validateSocialLinks = (links) => {
  if (!links) return { valid: true, normalized: [] };

  if (!Array.isArray(links)) {
    return { valid: false, error: 'Social links must be an array.' };
  }

  const normalized = [];
  const seenPlatforms = new Set();

  for (const item of links) {
    if (!item || typeof item !== 'object') continue;

    const platform = (item.platform || '').toLowerCase().trim();
    const url = (item.url || '').trim();

    if (!platform || !url) continue;

    if (!ALLOWED_PLATFORMS.has(platform)) {
      return {
        valid: false,
        error: `Unsupported social platform '${platform}'. Allowed platforms: ${Array.from(ALLOWED_PLATFORMS).join(', ')}`,
      };
    }

    if (!isValidUrl(url)) {
      return {
        valid: false,
        error: `Invalid URL '${url}' for platform '${platform}'. URLs must start with http:// or https://`,
      };
    }

    // Deduplicate platforms (keep first occurrence)
    if (!seenPlatforms.has(platform)) {
      seenPlatforms.add(platform);
      normalized.push({ platform, url });
    }
  }

  return { valid: true, normalized };
};

/**
 * Validates theme configuration.
 *
 * @param {string} theme
 * @returns {{ valid: boolean, error?: string }}
 */
const validateTheme = (theme) => {
  if (!theme || typeof theme !== 'string') {
    return { valid: true, theme: 'minimal-light' };
  }

  const trimmed = theme.trim().toLowerCase();
  if (!ALLOWED_THEMES.has(trimmed)) {
    return {
      valid: false,
      error: `Invalid theme '${theme}'. Allowed themes: minimal-light, dark-slate, gradient`,
    };
  }

  return { valid: true, theme: trimmed };
};

module.exports = {
  validateUsername,
  validateAvatarUrl,
  validateSocialLinks,
  validateTheme,
};
