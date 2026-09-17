const RESERVED_SLUGS = new Set([
  'api',
  'r',
  'health',
  'auth',
  'admin',
  'dashboard',
  'login',
  'signup',
  'verify-email',
  'forgot-password',
  'reset-password',
  'settings',
  'profile',
]);

/**
 * Validates custom vanity slug format and checks reserved words.
 *
 * @param {string} slug
 * @returns {{ valid: boolean, error?: string }}
 */
const validateCustomSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Custom slug must be a non-empty string.' };
  }

  const trimmed = slug.trim();
  if (!trimmed) {
    return { valid: false, error: 'Custom slug cannot be empty or whitespace.' };
  }

  const slugRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!slugRegex.test(trimmed)) {
    return {
      valid: false,
      error:
        'Custom slug must be between 3 and 30 characters long and contain only letters, numbers, hyphens, or underscores.',
    };
  }

  if (RESERVED_SLUGS.has(trimmed.toLowerCase())) {
    return {
      valid: false,
      error: `The custom slug '${trimmed}' is reserved by the system.`,
    };
  }

  return { valid: true };
};

module.exports = {
  validateCustomSlug,
};
