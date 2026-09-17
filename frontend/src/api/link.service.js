const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Shared fetch wrapper for link API endpoints.
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
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

export const linkService = {
  createLink: (payload, token) => apiRequest('/links', 'POST', payload, token),
  getLinks: ({ page = 1, limit = 10, search = '' } = {}, token) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    return apiRequest(`/links?${params.toString()}`, 'GET', null, token);
  },
  deleteLink: (id, token) => apiRequest(`/links/${id}`, 'DELETE', null, token),
};
