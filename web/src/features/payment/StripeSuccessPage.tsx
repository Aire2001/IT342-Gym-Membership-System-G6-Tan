import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from './paymentApi';

const StripeSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<{
    paymentReference: string;
    membershipName: string;
    amount: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('No session ID found.');
      return;
    }
    paymentAPI.verifyStripePayment(sessionId)
      .then((res) => {
        const d = res.data.data;
        if (!d) {
          setStatus('error');
          setErrorMsg(res.data.error?.message || 'Verification failed.');
          return;
        }
        if (d.paymentStatus === 'COMPLETED') {
          setData({
            paymentReference: d.paymentReference,
            membershipName: d.membershipName,
            amount: d.amount,
          });
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg('Payment not completed. Please try again.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error?.message || 'Verification failed.');
      });
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Verifying your payment…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 border-2 border-red-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-500 text-sm mb-8">{errorMsg}</p>
          <button
            onClick={() => navigate('/memberships')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your <span className="text-blue-600 font-semibold">{data?.membershipName}</span> membership is now active.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left mb-6 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Receipt</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Reference No.</span>
              <span className="text-gray-900 font-mono font-semibold">{data?.paymentReference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Plan</span>
              <span className="text-gray-900 font-semibold">{data?.membershipName}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="text-gray-500 font-semibold">Amount Paid</span>
              <span className="text-blue-600 font-black text-lg">
                ₱{Number(data?.amount).toLocaleString('en-PH')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                COMPLETED
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Gateway</span>
              <span className="text-gray-900 font-semibold">Stripe (Test Mode)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/payments/history')}
            className="flex-1 py-3 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm"
          >
            Payment History
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeSuccessPage;
