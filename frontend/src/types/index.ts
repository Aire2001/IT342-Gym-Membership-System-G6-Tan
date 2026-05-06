export interface MembershipPlan {
  id: number;
  name: 'Basic' | 'Premium' | 'Annual';
  durationMonths: number;
  price: number;
  description: string;
}

export interface UserMembership {
  membershipName: string;
  status: 'Active' | 'Expired' | 'Cancelled';
  startDate: string;
  endDate: string;
}

export interface Payment {
  paymentId: number;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentReference: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  membershipName?: string;
  membershipId?: number;
  userEmail?: string;
}

export interface DashboardData {
  membershipStatus: string;
  membershipName: string;
  membershipPrice?: number;
  membershipDurationMonths?: number;
  membershipDescription?: string;
  startDate?: string;
  expirationDate: string;
  paymentStatus: string;
  totalSpent?: number;
  totalPayments?: number;
  lastPaymentDate?: string;
  paymentReference?: string;
}

export type PaymentMethod = 'GCASH' | 'Credit Card' | 'Bank Transfer';
