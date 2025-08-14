import axios from 'axios';

const apiClient = axios.create({
  baseURL: '', // Use relative URLs since nginx handles routing
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information for debugging
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    });
    
    // Create a more user-friendly error message
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    
    // Attach the user-friendly message to the error
    error.userMessage = errorMessage;
    
    return Promise.reject(error);
  }
);

export default apiClient;