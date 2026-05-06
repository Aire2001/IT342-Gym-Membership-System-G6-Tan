import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),
};

// ── Memberships ───────────────────────────────────────────────────────────────
export const membershipAPI = {
  getPlans: () => api.get('/memberships'),
  getPlan: (id: number) => api.get(`/memberships/${id}`),
  selectPlan: (membershipId: number) =>
    api.post('/user/membership/select', { membershipId }),
  getUserMembership: () => api.get('/user/membership'),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  createPayment: (data: {
    membershipId: number;
    amount: number;
    paymentMethod: string;
  }) => api.post('/payments', data),

  getHistory: () => api.get('/payments/history'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id: number, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  getPayments: () => api.get('/admin/payments'),
  updatePaymentStatus: (id: number, status: string) => api.put(`/admin/payments/${id}/status`, { status }),
  deletePayment: (id: number) => api.delete(`/admin/payments/${id}`),
};

// ── Membership Admin CRUD ─────────────────────────────────────────────────────
export const membershipAdminAPI = {
  create: (data: { name: string; durationMonths: number; price: number; description: string }) =>
    api.post('/memberships', data),
  update: (id: number, data: { name?: string; durationMonths?: number; price?: number; description?: string }) =>
    api.put(`/memberships/${id}`, data),
  delete: (id: number) => api.delete(`/memberships/${id}`),
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data: { firstname?: string; lastname?: string; profilePicture?: string }) =>
    api.put('/profile', data),
};

export default api;
