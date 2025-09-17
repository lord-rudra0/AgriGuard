// API Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:5000'
  },
  production: {
    apiUrl: 'https://agriguard-vgpa.onrender.com/',
    socketUrl: 'https://agriguard-vgpa.onrender.com/'
  }
};

// Get current environment
const environment = import.meta.env.MODE || 'development';

// Export configuration for current environment
export const apiConfig = config[environment];

// API base URL
export const API_BASE_URL = apiConfig.apiUrl;

// Socket.IO URL
export const SOCKET_URL = apiConfig.socketUrl;

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  if (environment === 'development') {
    // In development, use relative URLs (proxied by Vite)
    return endpoint;
  }
  // In production, use full URLs
  return `${API_BASE_URL}${endpoint}`;
};

// Axios instance configuration
export const axiosConfig = {
  baseURL: environment === 'development' ? undefined : API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};
