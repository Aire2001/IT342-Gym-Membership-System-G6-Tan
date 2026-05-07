import apiClient from '../../shared/api/client';

export const membershipAPI = {
  getPlans: () => apiClient.get('/memberships'),
  getPlan: (id: number) => apiClient.get(`/memberships/${id}`),
  selectPlan: (membershipId: number) => apiClient.post('/user/membership/select', { membershipId }),
  getUserMembership: () => apiClient.get('/user/membership'),
};

export const membershipAdminAPI = {
  create: (data: { name: string; durationMonths: number; price: number; description: string }) =>
    apiClient.post('/memberships', data),
  update: (id: number, data: { name?: string; durationMonths?: number; price?: number; description?: string }) =>
    apiClient.put(`/memberships/${id}`, data),
  delete: (id: number) => apiClient.delete(`/memberships/${id}`),
};
