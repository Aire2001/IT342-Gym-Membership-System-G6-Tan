import apiClient from '../../shared/api/client';

export const profileAPI = {
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data: { firstname?: string; lastname?: string; profilePicture?: string }) =>
    apiClient.put('/profile', data),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return apiClient.post('/profile/upload-photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    apiClient.post('/profile/change-password', data),
  setPassword: (data: { newPassword: string; confirmPassword: string }) =>
    apiClient.post('/profile/set-password', data),
  changeEmail: (data: { newEmail: string; password: string }) =>
    apiClient.put('/profile/email', data),
  getPreferences: () => apiClient.get('/profile/preferences'),
  savePreferences: (data: { notifEmail: boolean; notifPaymentReminders: boolean; notifMembershipAlerts: boolean }) =>
    apiClient.put('/profile/preferences', data),
};
