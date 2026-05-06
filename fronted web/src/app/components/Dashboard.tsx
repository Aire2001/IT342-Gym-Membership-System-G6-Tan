import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Calendar, CreditCard, CheckCircle, AlertCircle, Clock, Download,
  HelpCircle, Mail, LogOut, TrendingUp, DollarSign, Users
} from 'lucide-react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { apiClient, handleApiError } from '../services/api';
import { toast } from 'sonner';
import { Payment } from '../types';

export function Dashboard() {
  const { user, userMembership, payments, refreshUserData, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role === 'ADMIN') {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (userMembership) {
      calculateDaysRemaining(userMembership.end_date);
    }
  }, [userMembership]);

  useEffect(() => {
    if (payments && payments.length > 0) {
      setRecentPayments(payments.slice(0, 3));
    }
  }, [payments]);

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays);
  };

  const getMembershipStatus = () => {
    if (!userMembership) {
      return {
        status: 'No Membership',
        variant: 'secondary' as const,
        isActive: false
      };
    }

    const endDate = new Date(userMembership.end_date);
    const now = new Date();

    if (userMembership.status === 'Active' && endDate > now) {
      if (daysRemaining && daysRemaining <= 7) {
        return {
          status: 'Expiring Soon',
          variant: 'outline' as const,
          isActive: true,
          badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300 text-base px-4 py-2'
        };
      }
      return {
        status: 'Active',
        variant: 'default' as const,
        isActive: true
      };
    } else {
      return {
        status: 'Expired',
        variant: 'destructive' as const,
        isActive: false
      };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="default" className="bg-green-600 text-sm px-3 py-1">Completed</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="text-sm px-3 py-1">Pending</Badge>;
      case 'Failed':
        return <Badge variant="destructive" className="text-sm px-3 py-1">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-sm px-3 py-1">{status}</Badge>;
    }
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await refreshUserData();
      toast.success('Dashboard updated');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      const receiptContent = `
FITLIFE GYM - PAYMENT RECEIPT
================================
Reference: ${payment.payment_reference}
Date: ${new Date(payment.payment_date).toLocaleString()}
Member: ${user?.firstname} ${user?.lastname}
Email: ${user?.email}
Plan: ${payment.membership?.name}
Amount: ₱${payment.amount.toLocaleString()}
Payment Method: ${payment.payment_method}
Status: ${payment.payment_status}
Transaction Date: ${new Date(payment.payment_date).toLocaleDateString()}

Thank you for choosing FitLife Gym!
This is a computer-generated receipt.
      `;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.payment_reference}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@fitlife.com?subject=Support Request';
  };

  const handleFAQ = () => {
    navigate('/faq');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user || user.role === 'ADMIN') {
    return null;
  }

  const status = getMembershipStatus();

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-0">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Welcome Header - Bigger */}
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {user.firstname}! 👋
              </h1>
              <p className="text-xl text-gray-600">Track and manage your gym membership journey</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                  variant="outline"
                  onClick={handleRefreshData}
                  disabled={loading}
                  className="h-12 px-6 text-base font-medium border-2 cursor-pointer"
              >
                <Clock className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Updating...' : 'Refresh Dashboard'}
              </Button>
              <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="h-12 px-6 text-base font-medium cursor-pointer"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Overview - New Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Visits</p>
                    <p className="text-3xl font-bold mt-1">24</p>
                    <p className="text-blue-100 text-xs mt-1">+2 this month</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-200 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Spent</p>
                    <p className="text-3xl font-bold mt-1">₱{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                    <p className="text-purple-100 text-xs mt-1">Lifetime value</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-purple-200 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Days</p>
                    <p className="text-3xl font-bold mt-1">{userMembership ? daysRemaining || 0 : 0}</p>
                    <p className="text-green-100 text-xs mt-1">Days remaining</p>
                  </div>
                  <Calendar className="w-12 h-12 text-green-200 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expiration Warning Banner - Bigger */}
          {userMembership && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
              <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 shadow-lg">
                <div className="flex items-start gap-5">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-yellow-800 mb-2">Membership Expiring Soon! ⚠️</h3>
                    <p className="text-lg text-yellow-700 mb-5">
                      Your membership will expire in <span className="font-bold text-2xl">{daysRemaining}</span> {daysRemaining === 1 ? 'day' : 'days'}.
                      Renew now to avoid interruption of your gym access.
                    </p>
                    <Link to="/memberships">
                      <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-6 text-lg">
                        Renew Membership Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
          )}

          {/* Main Cards Grid - Bigger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Membership Status Card - Bigger */}
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">Membership Status</CardTitle>
                  {status.isActive ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                      <AlertCircle className="w-8 h-8 text-orange-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Badge
                    variant={status.variant}
                    className={`${status.badgeClass || 'text-base px-4 py-2 mb-5'}`}
                >
                  {status.status}
                </Badge>

                {userMembership && userMembership.membership && (
                    <div className="space-y-3 mt-4">
                      <p className="text-xl font-semibold">{userMembership.membership.name} Plan</p>
                      <p className="text-lg text-muted-foreground">
                        ₱{userMembership.membership.price.toLocaleString()} / {userMembership.membership.duration_months} months
                      </p>
                      {daysRemaining !== null && daysRemaining > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium">Progress</span>
                              <span>{Math.round((userMembership.membership.duration_months * 30 - daysRemaining) / (userMembership.membership.duration_months * 30) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, ((userMembership.membership.duration_months * 30 - daysRemaining) / (userMembership.membership.duration_months * 30) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                      )}
                    </div>
                )}

                {!userMembership && (
                    <div className="mt-4 space-y-4">
                      <p className="text-lg text-muted-foreground">You don't have an active membership yet.</p>
                      <Link to="/memberships" className="block">
                        <Button size="lg" className="w-full text-base py-6">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Period Card - Bigger */}
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">Membership Period</CardTitle>
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {userMembership ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-xl p-5">
                        <p className="text-sm text-blue-600 font-medium mb-1">Valid Until</p>
                        <p className="text-3xl font-bold text-blue-900">{formatDate(userMembership.end_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Started</p>
                        <p className="text-lg font-semibold">{formatDate(userMembership.start_date)}</p>
                      </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-5 text-center">
                        <p className="text-lg text-muted-foreground mb-3">No active membership</p>
                        <Link to="/memberships">
                          <Button variant="outline" size="lg" className="w-full">
                            Browse Plans
                          </Button>
                        </Link>
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status Card - Bigger */}
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">Payment Status</CardTitle>
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {userMembership ? (
                    <div className="space-y-4">
                      <Badge variant="default" className="bg-green-600 text-base px-4 py-2">Current</Badge>
                      <div className="bg-green-50 rounded-xl p-5">
                        <p className="text-sm text-green-600 font-medium mb-1">Last payment</p>
                        <p className="text-lg font-semibold">
                          {payments && payments.length > 0 ? formatDate(payments[0].payment_date) : 'N/A'}
                        </p>
                        {payments && payments.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-2 font-mono">
                              Ref: {payments[0].payment_reference}
                            </p>
                        )}
                      </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                      <Badge variant="secondary" className="text-base px-4 py-2">No Active Payment</Badge>
                      <div className="bg-gray-50 rounded-xl p-5 text-center">
                        <p className="text-lg text-muted-foreground mb-3">
                          Select a membership plan to get started
                        </p>
                        <Link to="/memberships">
                          <Button variant="outline" size="lg" className="w-full">
                            View Plans
                          </Button>
                        </Link>
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Membership Details Card - Bigger */}
          {userMembership && userMembership.membership && (
              <Card className="mb-12 shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Membership Details</CardTitle>
                  <CardDescription className="text-lg">{userMembership.membership.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center">
                      <p className="text-sm text-blue-600 font-medium mb-2">Plan</p>
                      <p className="text-xl font-bold text-blue-900">{userMembership.membership.name}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 text-center">
                      <p className="text-sm text-purple-600 font-medium mb-2">Duration</p>
                      <p className="text-xl font-bold text-purple-900">{userMembership.membership.duration_months} months</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center">
                      <p className="text-sm text-green-600 font-medium mb-2">Price</p>
                      <p className="text-xl font-bold text-green-900">₱{userMembership.membership.price.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 text-center">
                      <p className="text-sm text-orange-600 font-medium mb-2">Status</p>
                      <p className="text-xl font-bold text-orange-900">{userMembership.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Recent Payments Section - Bigger */}
          {recentPayments.length > 0 && (
              <Card className="mb-12 shadow-xl border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Recent Payments</CardTitle>
                    <CardDescription className="text-lg">Your latest payment transactions</CardDescription>
                  </div>
                  <Link to="/payment-history">
                    <Button variant="ghost" className="text-base font-medium">
                      View All →
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between border-b last:border-0 pb-5 last:pb-0">
                          <div className="flex-1">
                            <p className="text-lg font-semibold">{payment.membership?.name || 'Membership Payment'}</p>
                            <p className="text-base text-muted-foreground">
                              {formatDate(payment.payment_date)}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono mt-1">
                              Ref: {payment.payment_reference}
                            </p>
                          </div>
                          <div className="text-right ml-6">
                            <p className="text-2xl font-bold text-blue-600">₱{payment.amount.toLocaleString()}</p>
                            <div className="flex items-center justify-end gap-3 mt-2">
                              {getPaymentStatusBadge(payment.payment_status)}
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9"
                                  onClick={() => handleDownloadReceipt(payment)}
                                  title="Download Receipt"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Action Buttons - Bigger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link to="/memberships" className="w-full">
              <Button className="w-full h-auto py-8 text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" size="lg">
                <div className="text-center">
                  <p className="font-bold text-2xl mb-2">
                    {userMembership ? '🔄 Renew Membership' : '🚀 Get Started'}
                  </p>
                  <p className="text-base opacity-90">Browse membership plans and pricing</p>
                </div>
              </Button>
            </Link>

            <Link to="/payment-history" className="w-full">
              <Button variant="outline" className="w-full h-auto py-8 text-xl font-semibold border-2 shadow-lg" size="lg">
                <div className="text-center">
                  <p className="font-bold text-2xl mb-2">📜 Payment History</p>
                  <p className="text-base text-muted-foreground">View all your past transactions</p>
                </div>
              </Button>
            </Link>
          </div>

          {/* Need Help Section - Bigger */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-start gap-5">
              <div className="bg-blue-100 rounded-full p-3">
                <HelpCircle className="w-10 h-10 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-blue-900 mb-3">Need Help? We're Here for You! 💪</h3>
                <p className="text-lg text-blue-800 mb-6">
                  Our support team is available to assist you with your membership, payments, or any questions you may have.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                      size="lg"
                      className="bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 text-base px-8 py-6"
                      onClick={handleContactSupport}
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    Contact Support
                  </Button>
                  <Button
                      size="lg"
                      variant="ghost"
                      className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 text-base px-8 py-6"
                      onClick={handleFAQ}
                  >
                    Read FAQ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
  );
}