import apiClient from '../../shared/api/client';

export const dashboardAPI = {
  getData: () => apiClient.get('/dashboard'),
};
