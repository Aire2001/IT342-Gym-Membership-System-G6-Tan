import apiClient from '../../shared/api/client';

export const paymentAPI = {
  createPayment: (data: { membershipId: number; amount: number; paymentMethod: string }) =>
    apiClient.post('/payments', data),
  getHistory: () => apiClient.get('/payments/history'),
};
