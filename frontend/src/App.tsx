import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import Navbar from './shared/components/Navbar';
import Login from './features/auth/LoginPage';
import Register from './features/auth/RegisterPage';
import Dashboard from './features/dashboard/DashboardPage';
import MembershipPlans from './features/membership/MembershipPlansPage';
import PaymentPage from './features/payment/PaymentPage';
import PaymentHistory from './features/payment/PaymentHistoryPage';
import AdminPanel from './features/admin/AdminPanelPage';
import Profile from './features/profile/ProfilePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
  </>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      } />
      <Route path="/memberships" element={
        <ProtectedRoute><AppLayout><MembershipPlans /></AppLayout></ProtectedRoute>
      } />
      <Route path="/payments/new" element={
        <ProtectedRoute><AppLayout><PaymentPage /></AppLayout></ProtectedRoute>
      } />
      <Route path="/payments/history" element={
        <ProtectedRoute><AppLayout><PaymentHistory /></AppLayout></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute><AppLayout><AdminPanel /></AppLayout></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
