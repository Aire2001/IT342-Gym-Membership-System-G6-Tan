import apiClient from '../../shared/api/client';

export const authAPI = {
  register: (data: { firstname: string; lastname: string; email: string; password: string; confirmPassword: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
};
