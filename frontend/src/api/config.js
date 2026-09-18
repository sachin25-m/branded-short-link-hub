/**
 * Safely resolves and normalizes the API base URL from VITE_API_BASE_URL.
 * Ensures slashes and /api paths are correctly formatted.
 */
export const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  envUrl = envUrl.trim().replace(/\/+$/, '');

  // If using relative path like '/api'
  if (envUrl.startsWith('/')) {
    return envUrl;
  }

  // Ensure /api suffix exists if not present
  if (!envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/api`;
  }

  return envUrl;
};
