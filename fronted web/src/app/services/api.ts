// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// ================ Helper Functions ================

export const normalizeStatus = (status: string): string => {
  if (!status) return '';
  const normalized = status?.toString().trim().toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
};

// ================ Request/Response Interfaces ================"

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstname: string;
  lastname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  email: string;
}

export interface PaymentRequest {
  membershipId: number;
  amount: number;
  paymentMethod: string;
}

export interface MembershipSelectRequest {
  membershipId: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    userId?: number;
    email?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    firstname?: string;
    lastname?: string;
  } | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  timestamp: string;
}

export interface Membership {
  id: number;
  name: string;
  duration_months: number;
  price: number;
  description: string;
  created_at: string;
}

export interface MembershipResponse {
  success: boolean;
  data: Membership | Membership[] | null;
  error: any;
  timestamp: string;
}

export interface PaymentResponse {
  success: boolean;
  data: {
    paymentId?: number;
    paymentStatus?: string;
    paymentReference?: string;
    paymentDate?: string;
    membershipName?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } | null;
  error: any;
  timestamp: string;
}

export interface Payment {
  id: number;
  user_id: number;
  membership_id: number;
  amount: number;
  payment_reference: string;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  membership?: Membership;
}

export interface DashboardResponse {
  success: boolean;
  data: {
    membershipStatus?: string;
    expirationDate?: string;
    paymentStatus?: string;
    recentPayments?: any[];
  } | null;
  error: any;
  timestamp: string;
}

export interface AdminUsersResponse {
  success: boolean;
  data: Array<{
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    membership?: string;
    membershipStatus?: string;
    joinDate: string;
  }> | null;
  error: any;
  timestamp: string;
}

export interface AdminPaymentsResponse {
  success: boolean;
  data: Payment[] | null;
  error: any;
  timestamp: string;
}

export interface AdminStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    totalPayments: number;
    totalMemberships: number;
    totalRevenue: number;
    recentPayments?: Payment[];
  } | null;
  error: any;
  timestamp: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserMembershipRequest {
  membershipId: number;
}

// ================ API Client with Token Management ================

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null;
  private isBackendReachable: boolean = true;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.accessToken = localStorage.getItem('authToken');

    if (this.accessToken) {
      console.log('🔑 ApiClient initialized with existing token');
    }

    // Test backend connectivity
    this.testBackendConnectivity();
  }

  async testBackendConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/test`);
      if (response.ok) {
        this.isBackendReachable = true;
        console.log('✅ Backend is reachable');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Backend not reachable, using mock mode');
      this.isBackendReachable = false;
    }
    return false;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('authToken', token);
    console.log('🔐 Token set and stored in localStorage');
  }

  removeToken() {
    this.accessToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    console.log('🔓 Token removed from localStorage');
  }

  isBackendAvailable(): boolean {
    return this.isBackendReachable;
  }

  private async request<T>(
      endpoint: string,
      options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
      ...options.headers,
    };

    try {
      console.log(`📡 Making ${options.method || 'GET'} request to: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      console.log(`📥 Response (${response.status}):`, data);

      // Handle token expiration
      if (response.status === 401) {
        const errorData = data as AuthResponse;
        if (errorData.error?.code === 'AUTH-002') {
          console.log('⏰ Token expired, logging out...');
          this.removeToken();
          window.location.href = '/';
          throw new Error('Session expired. Please login again.');
        }
      }

      // Handle forbidden (admin routes)
      if (response.status === 403) {
        console.error('🚫 Access forbidden - insufficient permissions');
        throw {
          error: {
            code: 'AUTH-003',
            message: 'You do not have permission to access this resource'
          }
        };
      }

      if (!response.ok) {
        console.error(`❌ Request failed with status: ${response.status}`);
        throw data;
      }

      return data as T;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // ================ Auth Endpoints ================

  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('📝 Registering user:', data.email);
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.accessToken) {
      this.setToken(response.data.accessToken);
    }

    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('🔐 Logging in user:', data.email);
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.accessToken) {
      this.setToken(response.data.accessToken);

      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response;
  }

  async logout(email: string): Promise<AuthResponse> {
    console.log('🚪 Logging out user:', email);
    const response = await this.request<AuthResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.success) {
      this.removeToken();
    }

    return response;
  }

  // ================ Membership Endpoints ================

  async getMemberships(): Promise<MembershipResponse> {
    console.log('📦 Fetching memberships...');
    return this.request<MembershipResponse>('/memberships', {
      method: 'GET',
    });
  }

  async getMembership(id: number): Promise<MembershipResponse> {
    console.log('📦 Fetching membership:', id);
    return this.request<MembershipResponse>(`/memberships/${id}`, {
      method: 'GET',
    });
  }

  async selectMembership(data: MembershipSelectRequest): Promise<PaymentResponse> {
    console.log('🎯 Selecting membership:', data.membershipId);
    return this.request<PaymentResponse>('/user/membership/select', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints for membership management
  async createMembership(data: Omit<Membership, 'id' | 'created_at'>): Promise<MembershipResponse> {
    console.log('➕ Creating membership:', data.name);
    return this.request<MembershipResponse>('/memberships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMembership(id: number, data: Partial<Membership>): Promise<MembershipResponse> {
    console.log('✏️ Updating membership:', id);
    return this.request<MembershipResponse>(`/memberships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMembership(id: number): Promise<MembershipResponse> {
    console.log('🗑️ Deleting membership:', id);
    return this.request<MembershipResponse>(`/memberships/${id}`, {
      method: 'DELETE',
    });
  }

  // ================ Payment Endpoints ================

  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    console.log('💰 Creating payment:', {
      membershipId: data.membershipId,
      amount: data.amount,
      method: data.paymentMethod
    });

    try {
      const response = await this.request<PaymentResponse>('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('✅ Payment created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Payment creation failed:', error);
      throw error;
    }
  }

  async getPaymentHistory(): Promise<PaymentResponse> {
    console.log('📋 Fetching payment history...');
    return this.request<PaymentResponse>('/payments/history', {
      method: 'GET',
    });
  }

  async getPayment(id: number): Promise<PaymentResponse> {
    console.log('🔍 Fetching payment:', id);
    return this.request<PaymentResponse>(`/payments/${id}`, {
      method: 'GET',
    });
  }

  async updatePaymentStatus(paymentId: number, status: string): Promise<PaymentResponse> {
    console.log('🔄 Updating payment status:', { paymentId, status });
    return this.request<PaymentResponse>(`/payments/${paymentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: status.toUpperCase() }),
    });
  }

  async testPaymentEndpoint(): Promise<boolean> {
    try {
      console.log('🧪 Testing payment endpoint...');
      const response = await fetch(`${this.baseUrl}/payments/test`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment endpoint is working:', data);
        return true;
      }
    } catch (error) {
      console.error('❌ Payment endpoint not reachable:', error);
    }
    return false;
  }

  // ================ Dashboard Endpoints ================

  async getDashboard(): Promise<DashboardResponse> {
    console.log('📊 Fetching dashboard data...');
    return this.request<DashboardResponse>('/dashboard', {
      method: 'GET',
    });
  }

  // ================ Admin Endpoints ================

  async getAdminUsers(): Promise<AdminUsersResponse> {
    console.log('👥 Fetching all users (admin)...');
    return this.request<AdminUsersResponse>('/admin/users', {
      method: 'GET',
    });
  }

  async getAdminPayments(): Promise<AdminPaymentsResponse> {
    console.log('💰 Fetching all payments (admin)...');
    return this.request<AdminPaymentsResponse>('/admin/payments', {
      method: 'GET',
    });
  }

  async getAdminStats(): Promise<AdminStatsResponse> {
    console.log('📊 Fetching admin statistics...');
    return this.request<AdminStatsResponse>('/admin/dashboard/stats', {
      method: 'GET',
    });
  }

  async getUserById(userId: number): Promise<AuthResponse> {
    console.log('👤 Fetching user:', userId);
    return this.request<AuthResponse>(`/admin/users/${userId}`, {
      method: 'GET',
    });
  }

  async updateUserRole(userId: number, role: string): Promise<AuthResponse> {
    console.log('👤 Updating user role:', { userId, role });
    return this.request<AuthResponse>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: number): Promise<AuthResponse> {
    console.log('🗑️ Deleting user:', userId);
    return this.request<AuthResponse>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateUserMembership(userId: number, membershipId: number): Promise<AuthResponse> {
    console.log('🎯 Updating user membership:', { userId, membershipId });
    return this.request<AuthResponse>(`/admin/users/${userId}/membership`, {
      method: 'PUT',
      body: JSON.stringify({ membershipId }),
    });
  }

  // ================ Token Refresh ================

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing token...');
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data?.accessToken) {
      this.setToken(response.data.accessToken);

      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response;
  }

  // ================ Helper Methods ================

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// ================ Error Handler Utility ================

export const handleApiError = (error: any): string => {
  console.error('🔴 Error details:', error);

  if (error.error) {
    switch (error.error.code) {
      case 'AUTH-001':
        return 'Invalid email or password';
      case 'AUTH-002':
        return 'Your session has expired. Please login again.';
      case 'AUTH-003':
        return 'You do not have permission to perform this action';
      case 'VALID-001':
        if (error.error.details) {
          const details = error.error.details;
          return Object.keys(details)
              .map(key => `${key}: ${details[key]}`)
              .join(', ');
        }
        return 'Please check your input and try again';
      case 'DB-001':
        return 'The requested resource was not found';
      case 'DB-002':
        return 'This record already exists';
      case 'SYSTEM-001':
        return 'An internal server error occurred. Please try again later.';
      case 'PAY-001':
        return 'Payment failed: ' + (error.error.message || 'Please try again');
      default:
        return error.error.message || 'An unexpected error occurred';
    }
  }

  if (error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Network error. Please check your connection.';
};

// Legacy API export for backward compatibility
export const authAPI = {
  register: (data: RegisterRequest) => apiClient.register(data),
  login: (data: LoginRequest) => apiClient.login(data),
  logout: (email: string) => apiClient.logout(email),
  test: async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/auth/test`);
    return response.text();
  }
};

// Export a function to test payment endpoint
export const testPaymentEndpoint = () => apiClient.testPaymentEndpoint();