import axios from 'axios';
import keycloak from '../keycloak';
import { storeTokens, clearStoredTokens } from '../keycloak';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Use relative URLs since nginx handles routing
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30);
        storeTokens(keycloak.token, keycloak.refreshToken, keycloak.idToken);
      } catch {
        clearStoredTokens();
        window.location.href = '/admin/login';
        return Promise.reject(new Error('Token refresh failed'));
      }
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    });

    const errorMessage = error.response?.data?.detail ||
                        error.response?.data?.message ||
                        error.message ||
                        'An unexpected error occurred';

    error.userMessage = errorMessage;
    
    return Promise.reject(error);
  }
);

export default apiClient;
