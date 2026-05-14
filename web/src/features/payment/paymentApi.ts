import apiClient from '../../shared/api/client';

export const paymentAPI = {
  createPayment: (data: { membershipId: number; amount: number; paymentMethod: string }) =>
    apiClient.post('/payments', data),
  getHistory: () => apiClient.get('/payments/history'),
  createStripeSession: (data: { membershipId: number; paymentMethod: string }) =>
    apiClient.post('/payments/stripe/create-session', data),
  verifyStripePayment: (sessionId: string) =>
    apiClient.get(`/payments/stripe/verify?sessionId=${sessionId}`),
};
