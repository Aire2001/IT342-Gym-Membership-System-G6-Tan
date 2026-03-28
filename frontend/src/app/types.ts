export interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: 'USER' | 'ADMIN';
}

export interface Membership {
  id: number;
  name: string;
  duration_months: number;
  price: number;
  description: string;
}

export interface UserMembership {
  id: number;
  user_id: number;
  membership_id: number;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Expired' | 'Cancelled';
  membership?: Membership;
}

export interface Payment {
  id: number;
  user_id: number;
  membership_id: number;
  amount: number;
  payment_reference: string;
  payment_method: 'GCASH' | 'Credit Card' | 'Bank Transfer';
  payment_status: 'Pending' | 'Completed' | 'Failed';
  payment_date: string;
  membership?: Membership;
}
