// API Configuration for different environments (fallbacks)
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

// Base config for the current environment
export const apiConfig = config[environment];

// Runtime-aware values: prefer Vite-provided env vars when present
const RUNTIME_API = import.meta.env.VITE_API_URL ?? apiConfig.apiUrl;
const RUNTIME_SOCKET = import.meta.env.VITE_SOCKET_URL ?? apiConfig.socketUrl;

// Validate and normalise URLs (best-effort). If invalid, warn and fall back to original
function normalizeUrl(value) {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    return u.href.endsWith('/') ? u.href : `${u.href}/`;
  } catch (e) {
    console.warn('[api] Provided API URL is not a full URL:', value);
    return value;
  }
}

export const API_BASE_URL = normalizeUrl(RUNTIME_API) || apiConfig.apiUrl;
export const SOCKET_URL = normalizeUrl(RUNTIME_SOCKET) || apiConfig.socketUrl;

// Helper: return full API path in production, or relative endpoint in development so Vite proxy works
export const getApiUrl = (endpoint) => {
  if (environment === 'development' && !import.meta.env.VITE_API_URL) {
    // use relative endpoints so Vite dev server can proxy /api
    return endpoint;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
};

// Axios instance configuration (used by contexts to set defaults)
export const axiosConfig = {
  // In development without explicit VITE_API_URL we leave baseURL undefined to use Vite proxy
  baseURL: (environment === 'development' && !import.meta.env.VITE_API_URL) ? undefined : API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Utility that warns when required env vars are missing or invalid
export function warnIfMisconfigured() {
  if (!API_BASE_URL) {
    console.warn('[api] API_BASE_URL is empty — frontend REST calls may fail in production. Set VITE_API_URL');
  }
  if (!SOCKET_URL) {
    console.warn('[api] SOCKET_URL is empty — socket connections may fallback to proxy or fail. Set VITE_SOCKET_URL');
  }
}
