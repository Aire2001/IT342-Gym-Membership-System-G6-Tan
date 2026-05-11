import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from './dashboardApi';
import { adminAPI } from '../admin/adminApi';
import { membershipAPI } from '../membership/membershipApi';
import { useAuth } from '../auth/AuthContext';
import type { DashboardData } from '../../shared/types';

// ── Shared badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Expired: 'bg-red-100 text-red-600 border-red-200',
    Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Failed: 'bg-red-100 text-red-600 border-red-200',
    FAILED: 'bg-red-100 text-red-600 border-red-200',
    'N/A': 'bg-gray-100 text-gray-400 border-gray-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
};

// ── Admin dashboard ───────────────────────────────────────────────────────────

const AdminDashboard = ({ name }: { name: string }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailModal, setDetailModal] = useState<{
    type: 'revenue' | 'members' | 'payments' | 'plans';
    label: string;
    items: any[];
  } | null>(null);

  useEffect(() => {
    Promise.all([adminAPI.getUsers(), adminAPI.getPayments(), membershipAPI.getPlans()])
      .then(([u, p, m]) => {
        setUsers(u.data.data || []);
        setPayments(p.data.data || []);
        setPlans(m.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const completed = payments.filter(p => p.paymentStatus?.toUpperCase() === 'COMPLETED');
    const totalRevenue = completed.reduce((s, p) => s + (p.amount ?? 0), 0);
    const completedCount = completed.length;
    const pendingCount = payments.filter(p => p.paymentStatus?.toUpperCase() === 'PENDING').length;
    const failedCount = payments.filter(p => p.paymentStatus?.toUpperCase() === 'FAILED').length;
    const memberCount = users.filter(u => u.role === 'USER').length;

    const planRevenue: Record<string, number> = {};
    completed.forEach(p => {
      if (p.membershipName) planRevenue[p.membershipName] = (planRevenue[p.membershipName] ?? 0) + (p.amount ?? 0);
    });
    const topPlan = Object.entries(planRevenue).sort((a, b) => b[1] - a[1])[0];

    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.paymentDate ?? 0).getTime() - new Date(a.paymentDate ?? 0).getTime())
      .slice(0, 5);
    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 5);

    return { totalRevenue, completedCount, pendingCount, failedCount, memberCount, planRevenue, topPlan, recentPayments, recentUsers, completed };
  }, [users, payments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { totalRevenue, completedCount, pendingCount, failedCount, memberCount, planRevenue, topPlan, recentPayments, recentUsers, completed } = stats;

  const openUserByEmail = (email: string) => {
    const u = users.find((x: any) => x.email === email);
    if (u) setSelectedUser(u);
  };

  const kpis = [
    {
      label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`,
      sub: 'Completed payments', gradient: 'from-blue-500 to-indigo-500', text: 'text-blue-600',
      onClick: () => setDetailModal({ type: 'revenue', label: 'Total Revenue', items: completed }),
    },
    {
      label: 'Total Members', value: String(memberCount),
      sub: `${users.filter(u => u.role === 'ADMIN').length} admin(s)`, gradient: 'from-purple-500 to-pink-500', text: 'text-purple-600',
      onClick: () => setDetailModal({ type: 'members', label: 'All Members', items: users.filter(u => u.role === 'USER') }),
    },
    {
      label: 'Completed Payments', value: String(completedCount),
      sub: `${pendingCount} pending`, gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-600',
      onClick: () => setDetailModal({ type: 'payments', label: 'Completed Payments', items: completed }),
    },
    {
      label: 'Active Plans', value: String(plans.length),
      sub: topPlan ? `Top: ${topPlan[0]}` : 'No sales yet', gradient: 'from-orange-400 to-amber-400', text: 'text-orange-500',
      onClick: () => setDetailModal({ type: 'plans', label: 'Active Plans', items: plans }),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* Header */}
        <div>
          <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest rounded-full mb-3">
            Admin Dashboard
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{name}</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here's your gym system overview for today.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(k => (
            <button key={k.label} onClick={k.onClick} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left hover:shadow-md hover:border-blue-300 transition-all group">
              <div className={`h-1.5 bg-gradient-to-r ${k.gradient}`} />
              <div className="p-5">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2 group-hover:text-gray-600 transition-colors">{k.label}</p>
                <p className="text-3xl font-black text-gray-900">{k.value}</p>
                <p className={`text-xs mt-1.5 font-medium ${k.text}`}>{k.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Breakdown + Revenue by plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment status bars */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Payment Status Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Completed', count: completedCount, color: 'bg-emerald-500', status: 'COMPLETED' },
                { label: 'Pending',   count: pendingCount,   color: 'bg-yellow-400',  status: 'PENDING'   },
                { label: 'Failed',    count: failedCount,    color: 'bg-red-400',     status: 'FAILED'    },
              ].map(({ label, count, color, status }) => (
                <button key={label} onClick={() => setDetailModal({ type: 'payments', label: `${label} Payments`, items: payments.filter(p => p.paymentStatus?.toUpperCase() === status) })} className="w-full text-left group hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold group-hover:text-blue-600 transition-colors">{label}</span>
                    <span>{count} / {payments.length}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`} style={{ width: payments.length > 0 ? `${(count / payments.length) * 100}%` : '0%' }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Revenue by plan */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Revenue by Plan</h3>
            {Object.keys(planRevenue).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No completed payments yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(planRevenue).sort((a, b) => b[1] - a[1]).map(([plan, rev]) => {
                  const pct = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0;
                  const colors: Record<string, string> = { Basic: 'bg-gray-400', Premium: 'bg-blue-500', Annual: 'bg-purple-500' };
                  return (
                    <button key={plan} onClick={() => setDetailModal({ type: 'payments', label: `${plan} — Revenue`, items: payments.filter(p => p.membershipName === plan && p.paymentStatus?.toUpperCase() === 'COMPLETED') })} className="w-full text-left group hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="font-semibold group-hover:text-blue-600 transition-colors">{plan}</span>
                        <span>₱{rev.toLocaleString('en-PH')} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${colors[plan] ?? 'bg-blue-400'} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent payments + recent users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent payments */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Recent Payments</h3>
              <button onClick={() => navigate('/admin')} className="text-xs text-blue-600 hover:underline font-semibold">View all</button>
            </div>
            {recentPayments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No payments yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentPayments.map((p: any) => (
                  <button key={p.paymentId} onClick={() => openUserByEmail(p.userEmail)} className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-blue-50 transition-colors text-left group">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600">{p.userEmail}</p>
                      <p className="text-xs text-gray-400">{p.membershipName || '—'} · {p.paymentDate?.slice(0, 10) ?? '—'}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">₱{p.amount?.toLocaleString('en-PH')}</p>
                      <StatusBadge status={p.paymentStatus} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Recent Registrations</h3>
              <button onClick={() => navigate('/admin')} className="text-xs text-blue-600 hover:underline font-semibold">View all</button>
            </div>
            {recentUsers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No users yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentUsers.map((u: any) => {
                  const initials = `${u.firstname?.[0] ?? ''}${u.lastname?.[0] ?? ''}`.toUpperCase() || '?';
                  return (
                    <button key={u.id} onClick={() => setSelectedUser(u)} className="w-full px-6 py-3.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{u.firstname} {u.lastname}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/admin')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all">
              Manage Users
            </button>
            <button onClick={() => navigate('/admin')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all">
              View Payments
            </button>
            <button onClick={() => navigate('/admin')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all">
              Manage Plans
            </button>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl text-sm transition-all">
              Refresh Data
            </button>
          </div>
        </div>

      </div>

      {/* ── KPI / filtered detail modal ── */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">{detailModal.label}</h2>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">

              {/* Revenue summary */}
              {detailModal.type === 'revenue' && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-blue-700">₱{totalRevenue.toLocaleString('en-PH')}</p>
                      <p className="text-xs text-blue-500 font-semibold mt-1">Total Revenue</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-emerald-700">{completedCount}</p>
                      <p className="text-xs text-emerald-500 font-semibold mt-1">Completed Payments</p>
                    </div>
                  </div>
                  {Object.entries(planRevenue).sort((a, b) => b[1] - a[1]).map(([plan, rev]) => (
                    <div key={plan} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 text-sm">
                      <span className="font-semibold text-gray-800">{plan}</span>
                      <span className="font-black text-blue-600">₱{rev.toLocaleString('en-PH')}</span>
                    </div>
                  ))}
                  {detailModal.items.length > 0 && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2 pb-1">Payment Records</p>
                  )}
                </>
              )}

              {/* Members list */}
              {detailModal.type === 'members' && detailModal.items.map((u: any) => {
                const ini = `${u.firstname?.[0] ?? ''}${u.lastname?.[0] ?? ''}`.toUpperCase() || '?';
                return (
                  <button key={u.id} onClick={() => { setDetailModal(null); setSelectedUser(u); }} className="w-full flex items-center gap-3 bg-gray-50 hover:bg-blue-50 rounded-xl px-4 py-3 text-left transition-colors group">
                    {u.profilePicture ? (
                      <img src={u.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{ini}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{u.firstname} {u.lastname}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{u.createdAt?.slice(0, 10) ?? '—'}</p>
                  </button>
                );
              })}

              {/* Plans list */}
              {detailModal.type === 'plans' && detailModal.items.map((m: any) => (
                <div key={m.id} className="bg-gray-50 rounded-xl px-4 py-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">{m.name}</span>
                    <span className="font-black text-blue-600">₱{m.price?.toLocaleString('en-PH')}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{m.durationMonths} {m.durationMonths === 1 ? 'month' : 'months'} · {m.description || '—'}</p>
                </div>
              ))}

              {/* Payment rows (used by 'payments' type and 'revenue' type) */}
              {(detailModal.type === 'payments' || detailModal.type === 'revenue') && detailModal.items.map((p: any) => (
                <button key={p.paymentId} onClick={() => { setDetailModal(null); openUserByEmail(p.userEmail); }} className="w-full flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-xl px-4 py-3 text-left transition-colors group">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 truncate">{p.userEmail}</p>
                    <p className="text-xs text-gray-400">{p.membershipName || '—'} · {p.paymentDate?.slice(0, 10) ?? '—'} · {p.paymentMethod}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">₱{p.amount?.toLocaleString('en-PH')}</p>
                    <StatusBadge status={p.paymentStatus} />
                  </div>
                </button>
              ))}

              {detailModal.items.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">No data found.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setDetailModal(null)} className="w-full py-2.5 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── User profile modal ── */}
      {selectedUser && (() => {
        const userInitials = `${selectedUser.firstname?.[0] ?? ''}${selectedUser.lastname?.[0] ?? ''}`.toUpperCase() || '?';
        const userPayments = payments.filter((p: any) => p.userEmail === selectedUser.email);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setSelectedUser(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900">User Profile</h2>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                <div className="flex items-center gap-4">
                  {selectedUser.profilePicture ? (
                    <img src={selectedUser.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-black shadow">
                      {userInitials}
                    </div>
                  )}
                  <div>
                    <p className="font-black text-gray-900 text-lg leading-tight">{selectedUser.firstname} {selectedUser.lastname}</p>
                    <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                    <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Account ID</span><span className="font-semibold text-gray-800">#{selectedUser.id}</span></div>
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Joined</span><span className="font-semibold text-gray-800">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Total Payments</span><span className="font-semibold text-gray-800">{userPayments.length}</span></div>
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Total Spent</span><span className="font-semibold text-blue-600">₱{userPayments.filter((p: any) => p.paymentStatus?.toUpperCase() === 'COMPLETED').reduce((s: number, p: any) => s + (p.amount ?? 0), 0).toLocaleString('en-PH')}</span></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Payment History</p>
                  {userPayments.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-xl">No payments found.</p>
                  ) : (
                    <div className="space-y-2">
                      {userPayments.map((p: any) => (
                        <div key={p.paymentId} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-xs font-mono font-bold text-gray-700">{p.paymentReference}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.membershipName || '—'} · {p.paymentDate?.slice(0, 10) ?? '—'} · {p.paymentMethod}</p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className="text-sm font-bold text-gray-900">₱{p.amount?.toLocaleString('en-PH')}</p>
                            <StatusBadge status={p.paymentStatus} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100">
                <button onClick={() => setSelectedUser(null)} className="w-full py-2.5 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm transition-all">Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ── Member dashboard ──────────────────────────────────────────────────────────

const MemberDashboard = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);

  useEffect(() => {
    dashboardAPI.getData()
      .then(res => setData(res.data.data))
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));

    // Fetch motivational quote from external API (proxied through backend)
    fetch('/api/v1/quotes/daily')
      .then(r => r.json())
      .then(j => { if (j.success && j.data) setQuote(j.data); })
      .catch(() => {});
  }, []);

  const daysLeft = data?.expirationDate
    ? Math.max(0, Math.ceil((new Date(data.expirationDate).getTime() - Date.now()) / 86400000))
    : null;

  const daysActive = data?.startDate
    ? Math.max(0, Math.ceil((Date.now() - new Date(data.startDate).getTime()) / 86400000))
    : 0;

  const totalDays = data?.startDate && data?.expirationDate
    ? Math.ceil((new Date(data.expirationDate).getTime() - new Date(data.startDate).getTime()) / 86400000)
    : null;

  const progressPct = totalDays && daysLeft !== null
    ? Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)))
    : 0;

  const initials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase() || user.email?.[0]?.toUpperCase()
    : '?';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: greeting */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-black shadow-lg flex-shrink-0">
                {user?.profilePicture
                  ? <img src={user.profilePicture} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                  : initials}
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium">{greeting()},</p>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                  {user?.firstname ? `${user.firstname} ${user.lastname ?? ''}`.trim() : user?.email?.split('@')[0]}
                </h1>
                <p className="text-blue-200 text-sm mt-0.5">
                  {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Right: membership badge */}
            {data && (
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-2xl px-5 py-3 self-start md:self-auto">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-blue-200 text-xs font-medium">Current Plan</p>
                  <p className="text-white font-bold text-sm">{data.membershipName || 'No Plan'}</p>
                  <span className={`text-xs font-bold ${data.membershipStatus === 'Active' ? 'text-emerald-300' : 'text-red-300'}`}>
                    ● {data.membershipStatus || 'Inactive'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {!loading && data && (
          <>
            {/* Motivational quote from ZenQuotes external API */}
            {quote && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-indigo-900 font-semibold text-sm leading-relaxed italic">"{quote.quote}"</p>
                  <p className="text-indigo-500 text-xs font-bold mt-1.5">— {quote.author}</p>
                </div>
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: 'Total Payments', value: String(data.totalPayments ?? 0),
                  sub: 'All time transactions', gradient: 'from-blue-500 to-indigo-500',
                  iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>,
                  to: '/payments/history',
                },
                {
                  label: 'Total Spent', value: `₱${(data.totalSpent ?? 0).toLocaleString('en-PH')}`,
                  sub: 'Completed payments', gradient: 'from-purple-500 to-pink-500',
                  iconBg: 'bg-purple-50', iconColor: 'text-purple-500',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
                  to: '/payments/history',
                },
                {
                  label: 'Active Days', value: String(daysActive),
                  sub: 'Since membership start', gradient: 'from-emerald-500 to-teal-400',
                  iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
                  to: '/memberships',
                },
              ].map(s => (
                <button key={s.label} onClick={() => navigate(s.to)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <svg className={`w-6 h-6 ${s.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-0.5">{s.label}</p>
                    <p className="text-2xl font-black text-gray-900 leading-tight truncate">{s.value}</p>
                    <p className={`text-xs font-medium mt-0.5 ${s.iconColor}`}>{s.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Membership + Period + Payment row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Plan card */}
              <button onClick={() => navigate('/memberships')}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-left hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Membership</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-black text-gray-900 mb-3">{data.membershipName || '—'}</p>
                <StatusBadge status={data.membershipStatus} />
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-lg font-black text-blue-600">₱{data.membershipPrice?.toLocaleString('en-PH') ?? '—'}</p>
                    <p className="text-xs text-gray-400">Price</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-purple-600">{data.membershipDurationMonths ?? '—'}<span className="text-sm font-semibold"> mo</span></p>
                    <p className="text-xs text-gray-400">Duration</p>
                  </div>
                </div>
              </button>

              {/* Period + progress card */}
              <button onClick={() => navigate('/memberships')}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-left hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Membership Period</p>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Start</p>
                      <p className="text-sm font-bold text-gray-800">
                        {data.startDate ? new Date(data.startDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">Expires</p>
                      <p className="text-sm font-bold text-gray-800">
                        {data.expirationDate ? new Date(data.expirationDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {totalDays !== null && (
                    <>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${daysLeft !== null && daysLeft <= 7 ? 'bg-red-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400">{progressPct}% used</p>
                        <p className={`text-xs font-bold ${daysLeft !== null && daysLeft <= 7 ? 'text-red-500' : 'text-blue-600'}`}>
                          {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days left` : 'Expired') : '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </button>

              {/* Last payment card */}
              <button onClick={() => navigate('/payments/history')}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-left hover:shadow-md hover:border-purple-200 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Last Payment</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <StatusBadge status={data.paymentStatus || 'N/A'} />
                  </div>
                  {data.lastPaymentDate && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date</p>
                      <p className="text-sm font-bold text-gray-800">
                        {new Date(data.lastPaymentDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Total Payments Made</p>
                    <p className="text-lg font-black text-gray-900">{data.totalPayments ?? 0} <span className="text-sm font-normal text-gray-400">transaction{(data.totalPayments ?? 0) !== 1 ? 's' : ''}</span></p>
                  </div>
                </div>
              </button>
            </div>

            {/* Description + Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">Plan Description</h2>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{data.membershipDescription || 'No description available for this plan.'}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Quick Actions</p>
                  <p className="text-white font-bold text-base leading-tight">Manage your gym membership</p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <button onClick={() => navigate('/memberships')}
                    className="w-full py-2.5 bg-white text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-50 transition-all shadow-sm">
                    {data.membershipStatus === 'Active' ? '⚡ Upgrade Plan' : '🏋️ Get Membership'}
                  </button>
                  <button onClick={() => navigate('/payments/history')}
                    className="w-full py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl text-sm transition-all">
                    📋 Payment History
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !data && !error && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <p className="text-gray-900 text-xl font-black mb-2">No membership yet</p>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">Browse our plans and start your fitness journey today.</p>
            <button onClick={() => navigate('/memberships')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm">
              Browse Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Root component — picks which dashboard to render ─────────────────────────

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const displayName = user?.firstname || user?.email?.split('@')[0] || 'Admin';
  return isAdmin ? <AdminDashboard name={displayName} /> : <MemberDashboard user={user} />;
};

export default Dashboard;
