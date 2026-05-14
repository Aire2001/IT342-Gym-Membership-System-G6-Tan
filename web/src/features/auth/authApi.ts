import apiClient from '../../shared/api/client';

export const authAPI = {
  register: (data: { firstname: string; lastname: string; email: string; password: string; confirmPassword: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  googleLogin: (data: { idToken: string }) =>
    apiClient.post('/auth/oauth/google', data),
  forgotPassword: (data: { email: string }) =>
    apiClient.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; newPassword: string; confirmPassword: string }) =>
    apiClient.post('/auth/reset-password', data),
};
