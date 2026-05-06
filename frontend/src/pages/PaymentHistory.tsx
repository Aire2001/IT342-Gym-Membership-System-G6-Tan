import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import type { Payment } from '../types';

const normalizeStatus = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const StatusBadge = ({ status }: { status: string }) => {
  const label = normalizeStatus(status);
  const styles: Record<string, string> = {
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Failed: 'bg-red-100 text-red-600 border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[label] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {label}
    </span>
  );
};

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    paymentAPI.getHistory()
      .then(res => setPayments(res.data.data || []))
      .catch(() => setError('Failed to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = payments
    .filter(p => p.paymentStatus?.toUpperCase() === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment History</h1>
            <p className="text-gray-400 text-sm mt-1">All your membership payment records</p>
          </div>
          <button
            onClick={() => navigate('/memberships')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
          >
            + New Payment
          </button>
        </div>

        {/* Summary */}
        {payments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 mt-1">Total Payments</p>
              <p className="text-2xl font-black text-gray-900">{payments.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 mt-1">Total Paid</p>
              <p className="text-2xl font-black text-purple-600">₱{totalPaid.toLocaleString('en-PH')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 mt-1">Completed</p>
              <p className="text-2xl font-black text-emerald-600">
                {payments.filter(p => p.paymentStatus?.toUpperCase() === 'COMPLETED').length}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && payments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr
                    key={p.paymentId}
                    className={`hover:bg-gray-50 transition-colors ${idx < payments.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{p.paymentReference}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{p.membershipName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.paymentMethod}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ₱{p.amount?.toLocaleString('en-PH')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={p.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty */}
        {!loading && payments.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="text-gray-700 font-semibold mb-1">No payments yet</p>
            <p className="text-gray-400 text-sm mb-6">Get a membership to start your fitness journey.</p>
            <button
              onClick={() => navigate('/memberships')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm shadow-sm"
            >
              Browse Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
