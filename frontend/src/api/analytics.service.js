const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Shared fetch wrapper for analytics API endpoints.
 */
const apiRequest = async (endpoint = '', method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}/analytics${endpoint}`, config);
  const data = await response.json().catch(() => ({
    success: false,
    message: `Server returned HTTP ${response.status}`,
  }));

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || 'An unexpected error occurred.',
      data,
    };
  }

  return data;
};

export const analyticsService = {
  getAnalytics: (token) => apiRequest('', 'GET', null, token),
};
