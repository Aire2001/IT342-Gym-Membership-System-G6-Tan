import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from './paymentApi';
import type { Payment } from '../../shared/types';

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

const downloadReceipt = (p: Payment) => {
  const date = p.paymentDate
    ? new Date(p.paymentDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const amount = `₱${p.amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const status = normalizeStatus(p.paymentStatus);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt – ${p.paymentReference}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background:#f9fafb; display:flex; justify-content:center; padding:40px 16px; }
    .card { background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); width:100%; max-width:480px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#2563eb,#7c3aed); color:#fff; padding:32px 28px; text-align:center; }
    .logo { font-size:28px; font-weight:900; letter-spacing:-0.5px; margin-bottom:4px; }
    .subtitle { font-size:13px; opacity:0.8; }
    .badge { display:inline-block; margin-top:16px; padding:6px 18px; border-radius:999px; font-size:13px; font-weight:700;
      background:${status==='Completed'?'rgba(16,185,129,0.25)':status==='Pending'?'rgba(245,158,11,0.25)':'rgba(239,68,68,0.25)'};
      color:${status==='Completed'?'#6ee7b7':status==='Pending'?'#fde68a':'#fca5a5'}; }
    .body { padding:28px; }
    .ref { text-align:center; margin-bottom:24px; }
    .ref-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; margin-bottom:4px; }
    .ref-value { font-family:monospace; font-size:20px; font-weight:700; color:#1f2937; }
    .divider { border:none; border-top:1px dashed #e5e7eb; margin:20px 0; }
    .row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; }
    .row-label { font-size:13px; color:#6b7280; }
    .row-value { font-size:13px; font-weight:600; color:#111827; }
    .amount-row { background:#f0f9ff; border-radius:10px; padding:14px 16px; margin:16px 0; display:flex; justify-content:space-between; align-items:center; }
    .amount-label { font-size:14px; color:#1d4ed8; font-weight:600; }
    .amount-value { font-size:22px; font-weight:900; color:#1d4ed8; }
    .footer { text-align:center; padding:20px 28px; background:#f9fafb; border-top:1px solid #f3f4f6; }
    .footer p { font-size:12px; color:#9ca3af; line-height:1.6; }
    @media print { body{padding:0} .card{box-shadow:none;border-radius:0;max-width:100%} }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">FitLife Gym</div>
      <div class="subtitle">Membership Portal — Official Receipt</div>
      <div class="badge">${status}</div>
    </div>
    <div class="body">
      <div class="ref">
        <div class="ref-label">Payment Reference</div>
        <div class="ref-value">${p.paymentReference || '—'}</div>
      </div>
      <hr class="divider"/>
      <div class="row"><span class="row-label">Membership Plan</span><span class="row-value">${p.membershipName || '—'}</span></div>
      <div class="row"><span class="row-label">Payment Method</span><span class="row-value">${p.paymentMethod || '—'}</span></div>
      <div class="row"><span class="row-label">Payment Date</span><span class="row-value">${date}</span></div>
      <hr class="divider"/>
      <div class="amount-row">
        <span class="amount-label">Total Amount Paid</span>
        <span class="amount-value">${amount}</span>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for being a FitLife Gym member!<br/>Keep this receipt for your records.</p>
    </div>
  </div>
  <script>window.onload=()=>window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    paymentAPI.getHistory()
      .then(res => setPayments(res.data.data || []))
      .catch(() => setError('Failed to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter(p => {
      const matchSearch = !q ||
        p.paymentReference?.toLowerCase().includes(q) ||
        p.membershipName?.toLowerCase().includes(q) ||
        p.paymentMethod?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' ||
        p.paymentStatus?.toUpperCase() === statusFilter.toUpperCase();
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const totalPaid = payments
    .filter(p => p.paymentStatus?.toUpperCase() === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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

        {/* Search & Filter */}
        {!loading && payments.length > 0 && (
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Search by reference, plan, method..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 font-medium"
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
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
          <>
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
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No payments match your search.
                      </td>
                    </tr>
                  ) : filtered.map((p, idx) => (
                    <tr
                      key={p.paymentId}
                      className={`hover:bg-gray-50 transition-colors ${idx < filtered.length - 1 ? 'border-b border-gray-100' : ''}`}
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
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => downloadReceipt(p)}
                          title="Download Receipt"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                          </svg>
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-right">
                Showing {filtered.length} of {payments.length} record{payments.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
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
