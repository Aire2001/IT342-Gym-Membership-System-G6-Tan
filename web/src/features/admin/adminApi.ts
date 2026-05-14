import apiClient from '../../shared/api/client';

export const adminAPI = {
  getUsers: () => apiClient.get('/admin/users'),
  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),
  updateUserRole: (id: number, role: string) => apiClient.put(`/admin/users/${id}/role`, { role }),
  getPayments: () => apiClient.get('/admin/payments'),
  updatePaymentStatus: (id: number, status: string) => apiClient.put(`/admin/payments/${id}/status`, { status }),
  deletePayment: (id: number) => apiClient.delete(`/admin/payments/${id}`),
};
