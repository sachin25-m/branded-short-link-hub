import { getApiBaseUrl } from './config';

const API_BASE_URL = getApiBaseUrl();

/**
 * Service to check backend API health status.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Health check failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to connect to backend server',
    };
  }
};
