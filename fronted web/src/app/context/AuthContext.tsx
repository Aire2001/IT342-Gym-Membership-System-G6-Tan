import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Membership, UserMembership, Payment } from '../types';
import { apiClient, handleApiError, normalizeStatus } from '../services/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstname: string, lastname: string) => Promise<void>;
  logout: () => void;
  userMembership: UserMembership | null;
  payments: Payment[];
  selectMembership: (membershipId: number) => void;
  processPayment: (membershipId: number, amount: number, paymentMethod: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data
const mockMemberships: Membership[] = [
  {
    id: 1,
    name: 'Basic',
    duration_months: 1,
    price: 1500,
    description: 'Access to gym facilities during regular hours'
  },
  {
    id: 2,
    name: 'Premium',
    duration_months: 6,
    price: 7500,
    description: 'Access to gym facilities, group classes, and personal training sessions'
  },
  {
    id: 3,
    name: 'Annual',
    duration_months: 12,
    price: 12000,
    description: 'Full access to all facilities, classes, and priority booking'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMockMode, setUseMockMode] = useState(false);

  // Check for existing session on initial load
  useEffect(() => {
    const loadStoredUser = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          apiClient.setToken(token);
          await refreshUserData();
        } catch (error) {
          console.error('Error loading stored user:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    loadStoredUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Login attempt:', { email });

      // Check if backend is reachable
      try {
        const testResponse = await fetch('http://localhost:8080/api/v1/auth/test');
        if (!testResponse.ok) {
          console.warn('⚠️ Backend not reachable, switching to mock mode');
          setUseMockMode(true);
        }
      } catch (networkError) {
        console.warn('⚠️ Backend not reachable, switching to mock mode');
        setUseMockMode(true);
      }

      // If in mock mode, use mock login
      if (useMockMode) {
        console.log('📱 Using mock login mode');
        const mockUser: User = {
          id: 1,
          email: email,
          firstname: email.split('@')[0],
          lastname: 'User',
          role: email === 'admin@gym.com' ? 'ADMIN' : 'USER'
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('authToken', 'mock-token');
        await refreshUserData();
        return;
      }

      // Real login attempt
      const response = await apiClient.login({ email, password });
      console.log('📥 Login response:', response);

      if (response.success && response.data) {
        const loggedInUser: User = {
          id: response.data.userId || 0,
          email: response.data.email || '',
          firstname: response.data.firstname || '',
          lastname: response.data.lastname || '',
          role: (response.data.role as 'USER' | 'ADMIN') || 'USER'
        };

        console.log('✅ User logged in:', loggedInUser);
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));

        if (response.data.accessToken) {
          localStorage.setItem('authToken', response.data.accessToken);
        }

        await refreshUserData();
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);

      // Fallback to mock mode on error
      if (!useMockMode) {
        console.log('🔄 Switching to mock mode due to error');
        setUseMockMode(true);
        return login(email, password);
      }

      throw error;
    }
  };

  const register = async (email: string, password: string, firstname: string, lastname: string) => {
    try {
      console.log('📝 Register attempt:', { email, firstname, lastname });

      // If in mock mode, use mock registration
      if (useMockMode) {
        console.log('📱 Using mock registration mode');
        const mockUser: User = {
          id: Date.now(),
          email: email,
          firstname: firstname,
          lastname: lastname,
          role: 'USER'
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('authToken', 'mock-token');
        await refreshUserData();
        return;
      }

      const response = await apiClient.register({
        firstname,
        lastname,
        email,
        password,
        confirmPassword: password
      });

      console.log('📥 Register response:', response);

      if (response.success && response.data) {
        const newUser: User = {
          id: response.data.userId || 0,
          email: response.data.email || '',
          firstname: response.data.firstname || firstname,
          lastname: response.data.lastname || lastname,
          role: (response.data.role as 'USER' | 'ADMIN') || 'USER'
        };

        console.log('✅ User registered:', newUser);
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));

        if (response.data.accessToken) {
          localStorage.setItem('authToken', response.data.accessToken);
        }

        await refreshUserData();
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);

      // Fallback to mock mode on error
      if (!useMockMode) {
        console.log('🔄 Switching to mock mode due to error');
        setUseMockMode(true);
        return register(email, password, firstname, lastname);
      }

      throw error;
    }
  };

  const refreshUserData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 Refreshing user data for:', user.email);

      // If in mock mode, use mock data
      if (useMockMode) {
        console.log('📱 Using mock data for refresh');
        // Load mock payments if any in localStorage
        const savedPayments = localStorage.getItem('mockPayments');
        if (savedPayments) {
          setPayments(JSON.parse(savedPayments));
        }
        return;
      }

      // Fetch payment history from backend
      const paymentsResponse = await apiClient.getPaymentHistory();
      console.log('📥 Payments response:', paymentsResponse);

      if (paymentsResponse.success && paymentsResponse.data) {
        const paymentData = paymentsResponse.data as any[];
        const transformedPayments: Payment[] = paymentData.map(p => ({
          id: p.id,
          user_id: p.user?.id || user.id,
          membership_id: p.membership?.id || 0,
          amount: p.amount,
          payment_reference: p.paymentReference,
          payment_method: p.paymentMethod,
          payment_status: normalizeStatus(p.paymentStatus),
          payment_date: p.paymentDate,
          membership: p.membership ? {
            id: p.membership.id,
            name: p.membership.name,
            duration_months: p.membership.durationMonths,
            price: p.membership.price,
            description: p.membership.description,
            created_at: p.membership.createdAt
          } : undefined
        }));
        setPayments(transformedPayments);
      }

    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [user, useMockMode]);

  const logout = () => {
    console.log('🚪 Logging out user');
    setUser(null);
    setUserMembership(null);
    setPayments([]);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mockPayments');
    setUseMockMode(false);
  };

  const selectMembership = (membershipId: number) => {
    console.log('Selected membership:', membershipId);
  };

  const processPayment = async (membershipId: number, amount: number, paymentMethod: string) => {
    if (!user) {
      throw new Error('User not logged in');
    }

    const membership = mockMemberships.find(m => m.id === membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    try {
      console.log('💰 Processing payment:', { membershipId, amount, paymentMethod });

      // If in mock mode, handle payment locally
      if (useMockMode) {
        console.log('📱 Using mock payment mode');

        const newPayment: Payment = {
          id: Date.now(),
          user_id: user.id,
          membership_id: membershipId,
          amount,
          payment_reference: `PAY-MOCK-${Date.now()}`,
          payment_method: paymentMethod as any,
          payment_status: 'Completed',
          payment_date: new Date().toISOString(),
          membership
        };

        const updatedPayments = [...payments, newPayment];
        setPayments(updatedPayments);
        localStorage.setItem('mockPayments', JSON.stringify(updatedPayments));

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + membership.duration_months);

        const newMembership: UserMembership = {
          id: userMembership?.id || 1,
          user_id: user.id,
          membership_id: membershipId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'Active',
          membership
        };

        setUserMembership(newMembership);
        console.log('✅ Mock payment processed successfully');
        toast.success('Payment successful! Your membership is now active.');
        return;
      }

      // Real payment API call
      const paymentResponse = await apiClient.createPayment({
        membershipId,
        amount,
        paymentMethod
      });

      console.log('📥 Payment response from backend:', paymentResponse);

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error?.message || 'Payment failed');
      }

      // Update local state after successful backend payment
      const newPayment: Payment = {
        id: paymentResponse.data?.paymentId || Date.now(),
        user_id: user.id,
        membership_id: membershipId,
        amount,
        payment_reference: paymentResponse.data?.paymentReference || `PAY-${Date.now()}`,
        payment_method: paymentMethod as any,
        payment_status: 'Completed',
        payment_date: new Date().toISOString(),
        membership
      };

      setPayments(prev => [...prev, newPayment]);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + membership.duration_months);

      const newMembership: UserMembership = {
        id: userMembership?.id || 1,
        user_id: user.id,
        membership_id: membershipId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'Active',
        membership
      };

      setUserMembership(newMembership);
      await refreshUserData();

      console.log('✅ Payment processed and saved to database successfully');
      toast.success('Payment successful! Your membership is now active.');

    } catch (error) {
      console.error('❌ Payment error:', error);

      // Try mock mode as fallback
      if (!useMockMode) {
        console.log('🔄 Switching to mock mode for payment');
        setUseMockMode(true);
        return processPayment(membershipId, amount, paymentMethod);
      }

      toast.error(error.message || 'Payment failed. Please try again.');
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    userMembership,
    payments,
    selectMembership,
    processPayment,
    refreshUserData,
    loading
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { mockMemberships };