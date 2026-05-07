import apiClient from '../../shared/api/client';

export const profileAPI = {
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data: { firstname?: string; lastname?: string; profilePicture?: string }) =>
    apiClient.put('/profile', data),
};
