import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentAPI } from './paymentApi';
import { useAuth } from '../auth/AuthContext';
import type { MembershipPlan, PaymentMethod } from '../../shared/types';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'GCASH', label: 'GCash', icon: '📱' },
  { id: 'Credit Card', label: 'Credit Card', icon: '💳' },
  { id: 'Bank Transfer', label: 'Bank Transfer', icon: '🏦' },
];

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const plan: MembershipPlan = location.state?.plan;

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Admins Cannot Purchase</h2>
          <p className="text-gray-500 text-sm mb-6">Admin accounts are not allowed to buy membership plans. Use the Admin panel to manage members.</p>
          <button onClick={() => navigate('/admin')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm">
            Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState<{
    paymentId: number;
    paymentReference: string;
    paymentStatus: string;
  } | null>(null);

  useEffect(() => { if (!error) return; const t = setTimeout(() => setError(''), 3000); return () => clearTimeout(t); }, [error]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No membership plan selected.</p>
          <button
            onClick={() => navigate('/memberships')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // GCash and Credit Card → real Stripe checkout
      if (selectedMethod === 'GCASH' || selectedMethod === 'Credit Card') {
        const res = await paymentAPI.createStripeSession({
          membershipId: plan.id,
          paymentMethod: selectedMethod,
        });
        const { sessionUrl } = res.data.data;
        // Redirect to Stripe hosted checkout page
        window.location.href = sessionUrl;
        return;
      }
      // Bank Transfer → existing flow (PENDING, manual confirmation)
      const res = await paymentAPI.createPayment({
        membershipId: plan.id,
        amount: plan.price,
        paymentMethod: selectedMethod,
      });
      setSuccess(res.data.data);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message
        || (status === 401 || status === 403 ? 'Session expired. Please log in again.' : null)
        || (err.code === 'ERR_NETWORK' ? 'Server is offline. Please try again.' : null)
        || 'Payment failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const isPending = success.paymentStatus === 'PENDING';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {isPending ? (
            <div className="w-20 h-20 bg-yellow-100 border-2 border-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
          )}

          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {isPending ? 'Payment Pending' : 'Payment Successful!'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {isPending
              ? <>Your <span className="text-yellow-600 font-semibold">Bank Transfer</span> is being verified. Membership activates once confirmed.</>
              : <>Your <span className="text-blue-600 font-semibold">{plan.name}</span> membership is now active.</>
            }
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left mb-6 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Receipt</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Reference No.</span>
                <span className="text-gray-900 font-mono font-semibold">{success.paymentReference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Payment ID</span>
                <span className="text-gray-900">{success.paymentId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Plan</span>
                <span className="text-gray-900">{plan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duration</span>
                <span className="text-gray-900">{plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Method</span>
                <span className="text-gray-900">{selectedMethod}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-gray-500 font-semibold">Amount Paid</span>
                <span className="text-blue-600 font-black text-lg">
                  ₱{plan.price.toLocaleString('en-PH')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  {success.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/payments/history')}
              className="flex-1 py-3 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm transition-all"
            >
              Payment History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <button
            onClick={() => navigate('/memberships')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Plans
          </button>
          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full">
            Step 2 of 2
          </span>
          <h1 className="mt-3 text-3xl font-black text-gray-900 tracking-tight">Complete Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Review your order and choose a payment method.</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Order Summary</h2>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-gray-900 text-lg">{plan.name} Membership</p>
              <p className="text-gray-400 text-sm">{plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'} access · Full gym privileges</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-blue-600">₱{plan.price.toLocaleString('en-PH')}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between text-sm text-gray-400">
            <span>Membership ID</span>
            <span className="font-mono">PLAN-{plan.id.toString().padStart(4, '0')}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Method</h2>
          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  onChange={() => { setSelectedMethod(method.id); setError(''); }}
                  className="sr-only"
                />
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
                  <p className="text-gray-400 text-xs">
                    {method.id === 'GCASH' && 'Redirects to secure Stripe checkout'}
                    {method.id === 'Credit Card' && 'Visa, Mastercard · Secure Stripe checkout'}
                    {method.id === 'Bank Transfer' && 'BDO, BPI, UnionBank · Pending verification'}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${selectedMethod === method.id ? 'border-blue-500' : 'border-gray-300'}`}>
                  {selectedMethod === method.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            if (!selectedMethod) { setError('Please select a payment method.'); return; }
            setShowConfirm(true);
          }}
          disabled={loading || !selectedMethod}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-black text-base rounded-xl transition-all tracking-wide shadow-sm"
        >
          {`Confirm Payment · ₱${plan.price.toLocaleString('en-PH')}`}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Your payment is secured with SSL encryption
        </p>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 animate-fade-in">
            {/* Icon */}
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>

            <h2 className="text-xl font-black text-gray-900 text-center mb-1">Confirm Payment</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Are you sure you want to proceed?</p>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-gray-900">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-semibold text-gray-900">{selectedMethod}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500 font-semibold">Total</span>
                <span className="font-black text-blue-600 text-base">₱{plan.price.toLocaleString('en-PH')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); handlePayment(); }}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : 'Yes, Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
