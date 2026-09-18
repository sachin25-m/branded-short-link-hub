import { getApiBaseUrl } from './config';

const API_BASE_URL = getApiBaseUrl();

/**
 * Shared fetch wrapper with JSON headers and credentials: 'include'.
 */
const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
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

  const response = await fetch(`${API_BASE_URL}/auth${endpoint}`, config);
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

export const authService = {
  signup: (userData) => apiRequest('/signup', 'POST', userData),
  verifyEmail: (token) => apiRequest(`/verify-email?token=${encodeURIComponent(token)}`, 'GET'),
  login: (credentials) => apiRequest('/login', 'POST', credentials),
  refresh: () => apiRequest('/refresh', 'POST'),
  logout: () => apiRequest('/logout', 'POST'),
  forgotPassword: (email) => apiRequest('/forgot-password', 'POST', { email }),
  resetPassword: (payload) => apiRequest('/reset-password', 'POST', payload),
  getMe: (token) => apiRequest('/me', 'GET', null, token),
};
