import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url: string = err.config?.url ?? '';
    if (status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    } else if (status === 403 && url.includes('/admin')) {
      // Token invalid/expired for admin endpoint — force re-login
      localStorage.clear();
      window.location.href = '/login?reason=session_expired';
    }
    return Promise.reject(err);
  }
);

export default apiClient;
