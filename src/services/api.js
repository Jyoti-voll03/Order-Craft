import axios from 'axios';

// Always use relative '/api' first so whichever port Vite runs on (5173, 5177, etc.) works with zero CORS issues,
// and fallback to http://localhost:5000/api if needed.
export const API_BASE_URL = '/api';

const TOKEN_STORAGE_KEY = 'ordercraft_jwt_token_v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'x-ordercraft-client': 'web-dashboard',
  },
});

// Attach JWT token to every outgoing request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic fallback to http://localhost:5000/api if relative /api is not handled
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;
    if (
      originalConfig &&
      !originalConfig._retriedWithPort5000 &&
      originalConfig.baseURL === '/api'
    ) {
      originalConfig._retriedWithPort5000 = true;
      originalConfig.baseURL = 'http://localhost:5000/api';
      return axios(originalConfig);
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to authenticate default demo admin or custom credentials and store JWT.
 */
export async function loginToBackend(
  email = 'admin@ordercraft-mfg.in',
  password = 'password123'
) {
  const response = await api.post('/auth/login', { email, password });
  if (response.data?.data?.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.data.token);
  }
  return response.data;
}

export async function resetBackendDemoData() {
  const response = await api.post('/demo/reset');
  return response.data;
}

export default api;
