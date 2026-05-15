import { useEffect, useState } from 'react';
import { adminAPI } from './adminApi';
import { membershipAPI, membershipAdminAPI } from '../membership/membershipApi';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

type Tab = 'dashboard' | 'users' | 'payments' | 'memberships';

const normalizeStatus = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const StatusBadge = ({ status }: { status: string }) => {
  const label = normalizeStatus(status);
  const map: Record<string, string> = {
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Failed: 'bg-red-100 text-red-600 border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[label] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {label}
    </span>
  );
};

const ConfirmDialog = ({ message, onConfirm, onCancel, confirmLabel = 'Delete', confirmColor = 'bg-red-500 hover:bg-red-600' }: { message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; confirmColor?: string }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
      <p className="text-gray-800 font-semibold text-center mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:border-gray-400 transition-all">Cancel</button>
        <button onClick={onConfirm} className={`flex-1 py-2 ${confirmColor} text-white rounded-xl text-sm font-semibold transition-all`}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t === 'users' || t === 'payments' || t === 'memberships') return t;
    return 'dashboard';
  });
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void; confirmLabel?: string; confirmColor?: string } | null>(null);
  const [toast, setToast] = useState('');

  // Membership form state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', durationMonths: '', price: '', description: '' });
  const [planErrors, setPlanErrors] = useState({ name: '', durationMonths: '', price: '' });

  // User role edit state
  const [editingRole, setEditingRole] = useState<{ id: number; role: string } | null>(null);

  // User detail modal
  const [viewUser, setViewUser] = useState<any | null>(null);

  // Payment status edit state
  const [editingStatus, setEditingStatus] = useState<{ id: number; status: string } | null>(null);

  // Highlight state for jump-from-dashboard
  const [highlightUserId, setHighlightUserId] = useState<number | null>(null);
  const [highlightPaymentId, setHighlightPaymentId] = useState<number | null>(null);

  // Sort state
  const [userSort, setUserSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'id', dir: 'asc' });
  const [paymentSort, setPaymentSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'date', dir: 'desc' });
  const [planSort, setPlanSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'id', dir: 'asc' });

  // Search & filter state
  const [userSearch, setUserSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    setLoadError('');
    Promise.all([adminAPI.getUsers(), adminAPI.getPayments(), membershipAPI.getPlans()])
      .then(([u, p, m]) => {
        setUsers(u.data.data || []);
        setPayments(p.data.data || []);
        setMemberships(m.data.data || []);
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403) {
          setLoadError('Access denied (403). Please log out and log back in as an admin account.');
        } else if (status === 401) {
          setLoadError('Session expired. Please log in again.');
        } else {
          setLoadError(
            err.response?.data?.error?.message ||
            err.response?.data?.message ||
            'Failed to load admin data. Click Retry to try again.'
          );
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return; }
    load();
  }, [isAdmin]);

  // ── Users ──────────────────────────────────────────────────────────────────
  const handleDeleteUser = (id: number, name: string) => {
    setConfirm({
      message: `Delete user "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        await adminAPI.deleteUser(id);
        setUsers(u => u.filter(x => x.id !== id));
        showToast('User deleted.');
      },
    });
  };

  const handleSaveRole = (id: number) => {
    if (!editingRole) return;
    const user = users.find(u => u.id === id);
    setConfirm({
      message: `Change role of "${user?.firstname} ${user?.lastname}" to ${editingRole.role}?`,
      confirmLabel: 'Yes, Update',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      onConfirm: async () => {
        setConfirm(null);
        await adminAPI.updateUserRole(id, editingRole.role);
        setUsers(u => u.map(x => x.id === id ? { ...x, role: editingRole.role } : x));
        setEditingRole(null);
        showToast('Role updated.');
      },
    });
  };

  // ── Payments ───────────────────────────────────────────────────────────────
  const handleDeletePayment = (id: number, ref: string) => {
    setConfirm({
      message: `Delete payment "${ref}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        await adminAPI.deletePayment(id);
        setPayments(p => p.filter(x => x.paymentId !== id));
        showToast('Payment deleted.');
      },
    });
  };

  const handleSaveStatus = (id: number) => {
    if (!editingStatus) return;
    setConfirm({
      message: `Update payment status to "${editingStatus.status}"?`,
      confirmLabel: 'Yes, Update',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      onConfirm: async () => {
        setConfirm(null);
        await adminAPI.updatePaymentStatus(id, editingStatus.status);
        setPayments(p => p.map(x => x.paymentId === id ? { ...x, paymentStatus: editingStatus.status.toUpperCase() } : x));
        setEditingStatus(null);
        showToast('Payment status updated.');
      },
    });
  };

  // ── Memberships ────────────────────────────────────────────────────────────
  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', durationMonths: '', price: '', description: '' });
    setPlanErrors({ name: '', durationMonths: '', price: '' });
    setShowPlanForm(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({ name: plan.name, durationMonths: String(plan.durationMonths), price: String(plan.price), description: plan.description ?? '' });
    setPlanErrors({ name: '', durationMonths: '', price: '' });
    setShowPlanForm(true);
  };

  const handleSavePlan = async () => {
    const errors = { name: '', durationMonths: '', price: '' };
    if (!planForm.name.trim()) errors.name = 'Plan name is required.';
    if (!planForm.durationMonths || parseInt(planForm.durationMonths) < 1) errors.durationMonths = 'Enter a valid duration (min 1 month).';
    if (!planForm.price || parseFloat(planForm.price) <= 0) errors.price = 'Enter a valid price greater than 0.';
    setPlanErrors(errors);
    if (errors.name || errors.durationMonths || errors.price) return;

    const payload = {
      name: planForm.name.trim(),
      durationMonths: parseInt(planForm.durationMonths),
      price: parseFloat(planForm.price),
      description: planForm.description.trim(),
    };
    if (editingPlan) {
      const res = await membershipAdminAPI.update(editingPlan.id, payload);
      setMemberships(m => m.map(x => x.id === editingPlan.id ? res.data.data : x));
      showToast('Plan updated.');
    } else {
      const res = await membershipAdminAPI.create(payload);
      setMemberships(m => [...m, res.data.data]);
      showToast('Plan created.');
    }
    setShowPlanForm(false);
  };

  const handleDeletePlan = (id: number, name: string) => {
    setConfirm({
      message: `Delete plan "${name}"? Users with this plan may be affected.`,
      onConfirm: async () => {
        setConfirm(null);
        await membershipAdminAPI.delete(id);
        setMemberships(m => m.filter(x => x.id !== id));
        showToast('Plan deleted.');
      },
    });
  };

  const toggleSort = (
    current: { field: string; dir: 'asc' | 'desc' },
    field: string,
    setter: (v: { field: string; dir: 'asc' | 'desc' }) => void
  ) => setter(current.field === field ? { field, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });

  const sortedUsers = [...users]
    .filter(u => {
      if (!userSearch) return true;
      const q = userSearch.toLowerCase();
      return `${u.firstname ?? ''} ${u.lastname ?? ''}`.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.role ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const { field, dir } = userSort;
      if (field === 'id')   return dir === 'asc' ? a.id - b.id : b.id - a.id;
      if (field === 'date') return dir === 'asc' ? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime() : new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      const va = field === 'name' ? `${a.firstname ?? ''} ${a.lastname ?? ''}` : (a[field] ?? '');
      const vb = field === 'name' ? `${b.firstname ?? ''} ${b.lastname ?? ''}` : (b[field] ?? '');
      return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const sortedPayments = [...payments]
    .filter(p => {
      const q = paymentSearch.toLowerCase();
      const matchSearch = !q ||
        (p.paymentReference ?? '').toLowerCase().includes(q) ||
        (p.userEmail ?? '').toLowerCase().includes(q) ||
        (p.membershipName ?? '').toLowerCase().includes(q) ||
        (p.paymentMethod ?? '').toLowerCase().includes(q);
      const matchStatus = paymentStatusFilter === 'All' ||
        (p.paymentStatus ?? '').toUpperCase() === paymentStatusFilter.toUpperCase();
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const { field, dir } = paymentSort;
      if (field === 'date')   return dir === 'asc' ? new Date(a.paymentDate ?? 0).getTime() - new Date(b.paymentDate ?? 0).getTime() : new Date(b.paymentDate ?? 0).getTime() - new Date(a.paymentDate ?? 0).getTime();
      if (field === 'amount') return dir === 'asc' ? (a.amount ?? 0) - (b.amount ?? 0) : (b.amount ?? 0) - (a.amount ?? 0);
      const map: Record<string, string> = { email: 'userEmail', plan: 'membershipName', method: 'paymentMethod', status: 'paymentStatus' };
      const va = a[map[field] ?? field] ?? '';
      const vb = b[map[field] ?? field] ?? '';
      return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const sortedPlans = [...memberships].sort((a, b) => {
    const { field, dir } = planSort;
    if (field === 'id')       return dir === 'asc' ? a.id - b.id : b.id - a.id;
    if (field === 'price')    return dir === 'asc' ? a.price - b.price : b.price - a.price;
    if (field === 'duration') return dir === 'asc' ? a.durationMonths - b.durationMonths : b.durationMonths - a.durationMonths;
    return dir === 'asc' ? String(a.name ?? '').localeCompare(String(b.name ?? '')) : String(b.name ?? '').localeCompare(String(a.name ?? ''));
  });

  const SortArrow = ({ field, sort }: { field: string; sort: { field: string; dir: 'asc' | 'desc' } }) => (
    <span className="inline-flex flex-col ml-1 gap-px align-middle">
      <svg className={`w-2 h-2 ${sort.field === field && sort.dir === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z"/></svg>
      <svg className={`w-2 h-2 ${sort.field === field && sort.dir === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16z"/></svg>
    </span>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'users', label: `Users (${users.length})` },
    { key: 'payments', label: `Payments (${payments.length})` },
    { key: 'memberships', label: `Plans (${memberships.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-bold uppercase tracking-widest rounded-full">Admin</span>
          <h1 className="mt-3 text-3xl font-black text-gray-900">Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px
                ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p className="text-red-700 text-sm font-semibold truncate">{loadError}</p>
            </div>
            <button onClick={load} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* ── Dashboard Tab ── */}
        {!loading && tab === 'dashboard' && (() => {
          const totalRevenue = payments
            .filter((p: any) => p.paymentStatus?.toUpperCase() === 'COMPLETED')
            .reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);
          const completedCount = payments.filter((p: any) => p.paymentStatus?.toUpperCase() === 'COMPLETED').length;
          const pendingCount = payments.filter((p: any) => p.paymentStatus?.toUpperCase() === 'PENDING').length;
          const failedCount = payments.filter((p: any) => p.paymentStatus?.toUpperCase() === 'FAILED').length;
          const adminCount = users.filter((u: any) => u.role === 'ADMIN').length;
          const memberCount = users.filter((u: any) => u.role === 'USER').length;
          const recentPayments = [...payments].sort((a: any, b: any) =>
            new Date(b.paymentDate ?? 0).getTime() - new Date(a.paymentDate ?? 0).getTime()
          ).slice(0, 5);
          const recentUsers = [...users].sort((a: any, b: any) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
          ).slice(0, 5);

          const planRevenue: Record<string, number> = {};
          payments.forEach((p: any) => {
            if (p.paymentStatus?.toUpperCase() === 'COMPLETED' && p.membershipName) {
              planRevenue[p.membershipName] = (planRevenue[p.membershipName] ?? 0) + (p.amount ?? 0);
            }
          });
          const topPlan = Object.entries(planRevenue).sort((a, b) => b[1] - a[1])[0];

          return (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH')}`, sub: 'Completed payments', gradient: 'from-blue-500 to-indigo-500', tab: 'payments' as Tab, icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  )},
                  { label: 'Total Members', value: memberCount, sub: `${adminCount} admin(s)`, gradient: 'from-purple-500 to-pink-500', tab: 'users' as Tab, icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  )},
                  { label: 'Completed Payments', value: completedCount, sub: `${pendingCount} pending`, gradient: 'from-emerald-500 to-teal-400', tab: 'payments' as Tab, icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  )},
                  { label: 'Active Plans', value: memberships.length, sub: topPlan ? `Top: ${topPlan[0]}` : 'No sales yet', gradient: 'from-orange-400 to-amber-400', tab: 'memberships' as Tab, icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  )},
                ].map(card => (
                  <button key={card.label} onClick={() => setTab(card.tab)} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-left hover:shadow-md hover:border-blue-300 transition-all group">
                    <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest group-hover:text-gray-600 transition-colors">{card.label}</p>
                        <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white`}>{card.icon}</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900">{card.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Payment status breakdown + plan distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment status breakdown */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Payment Status Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Completed', count: completedCount, total: payments.length, color: 'bg-emerald-500' },
                      { label: 'Pending', count: pendingCount, total: payments.length, color: 'bg-yellow-400' },
                      { label: 'Failed', count: failedCount, total: payments.length, color: 'bg-red-400' },
                    ].map(({ label, count, total, color }) => (
                      <button key={label} onClick={() => setTab('payments')} className="w-full text-left group hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="font-semibold group-hover:text-blue-600 transition-colors">{label}</span>
                          <span>{count} / {total}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`${color} h-2 rounded-full transition-all`}
                            style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Revenue by plan */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Revenue by Plan</h3>
                  {Object.keys(planRevenue).length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No completed payments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(planRevenue)
                        .sort((a, b) => b[1] - a[1])
                        .map(([plan, rev]) => {
                          const pct = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0;
                          const colors: Record<string, string> = { Basic: 'bg-gray-400', Premium: 'bg-blue-500', Annual: 'bg-purple-500' };
                          return (
                            <button key={plan} onClick={() => setTab('memberships')} className="w-full text-left group hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors">
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
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800">Recent Payments</h3>
                    <button onClick={() => setTab('payments')} className="text-xs text-blue-600 hover:underline font-semibold">View all</button>
                  </div>
                  {recentPayments.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No payments yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {recentPayments.map((p: any) => (
                        <button key={p.paymentId} onClick={() => {
                          const found = users.find((u: any) => u.email === p.userEmail) || { email: p.userEmail, firstname: '', lastname: '', role: 'USER', id: null, createdAt: null };
                          setViewUser(found);
                        }} className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-blue-50 transition-colors text-left">
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
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800">Recent Registrations</h3>
                    <button onClick={() => setTab('users')} className="text-xs text-blue-600 hover:underline font-semibold">View all</button>
                  </div>
                  {recentUsers.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No users yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {recentUsers.map((u: any) => {
                        const initials = `${u.firstname?.[0] ?? ''}${u.lastname?.[0] ?? ''}`.toUpperCase() || '?';
                        return (
                          <button key={u.id} onClick={() => setViewUser(u)} className="w-full px-6 py-3.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800">{u.firstname} {u.lastname}</p>
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
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setTab('users')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all">
                    Manage Users
                  </button>
                  <button onClick={() => setTab('payments')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all">
                    View Payments
                  </button>
                  <button onClick={() => { setTab('memberships'); }} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all">
                    Manage Plans
                  </button>
                  <button onClick={load} className="px-5 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl text-sm transition-all">
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Users Tab ── */}
        {!loading && tab === 'users' && (
          <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                placeholder="Search by name, email, role..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {([
                    { label: 'ID',     field: 'id'    },
                    { label: 'Name',   field: 'name'  },
                    { label: 'Email',  field: 'email' },
                    { label: 'Role',   field: 'role'  },
                    { label: 'Joined', field: 'date'  },
                  ] as const).map(({ label, field }) => (
                    <th key={field} className="px-5 py-4 text-left">
                      <button onClick={() => toggleSort(userSort, field, setUserSort)} className="flex items-center gap-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                        {label}<SortArrow field={field} sort={userSort} />
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u: any, idx: number) => (
                  <tr key={u.id} className={`transition-colors ${idx < sortedUsers.length - 1 ? 'border-b border-gray-100' : ''} ${highlightUserId === u.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-4 text-sm text-gray-400">{u.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">{u.firstname} {u.lastname}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-4">
                      {editingRole?.id === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole?.role ?? ''}
                            onChange={e => setEditingRole({ id: u.id, role: e.target.value })}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button onClick={() => handleSaveRole(u.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all">Save</button>
                          <button onClick={() => setEditingRole(null)} className="px-3 py-1 border border-gray-300 hover:border-gray-400 text-gray-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                            Back
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-PH') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewUser(u)} className="text-xs text-purple-600 hover:underline font-semibold">View</button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => setEditingRole({ id: u.id, role: u.role })}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >Edit Role</button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => handleDeleteUser(u.id, `${u.firstname} ${u.lastname}`)}
                          className="text-xs text-red-500 hover:underline font-semibold"
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedUsers.length === 0 && (
              <div className="text-center py-14">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <p className="text-gray-400 text-sm font-medium">
                  {userSearch ? `No users matching "${userSearch}"` : 'No users found.'}
                </p>
                {userSearch && <button onClick={() => setUserSearch('')} className="mt-2 text-xs text-blue-600 hover:underline font-semibold">Clear search</button>}
              </div>
            )}
          </div>
          <div className="mt-4">
            <button
              onClick={() => setTab('dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Back to Dashboard
            </button>
          </div>
          </>
        )}

        {/* ── Payments Tab ── */}
        {!loading && tab === 'payments' && (
          <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                placeholder="Search by reference, user, plan, method..."
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={paymentStatusFilter}
              onChange={e => setPaymentStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 font-medium"
            >
              <option value="All">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Ref #</th>
                  {([
                    { label: 'User',   field: 'email'  },
                    { label: 'Plan',   field: 'plan'   },
                    { label: 'Method', field: 'method' },
                    { label: 'Date',   field: 'date'   },
                    { label: 'Amount', field: 'amount' },
                    { label: 'Status', field: 'status' },
                  ] as const).map(({ label, field }) => (
                    <th key={field} className="px-5 py-4 text-left">
                      <button onClick={() => toggleSort(paymentSort, field, setPaymentSort)} className="flex items-center gap-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                        {label}<SortArrow field={field} sort={paymentSort} />
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((p: any, idx: number) => (
                  <tr key={p.paymentId} className={`transition-colors ${idx < sortedPayments.length - 1 ? 'border-b border-gray-100' : ''} ${highlightPaymentId === p.paymentId ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-4 text-xs font-mono text-gray-600">{p.paymentReference}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">{p.userEmail}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{p.membershipName || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{p.paymentMethod}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {p.paymentDate ? (
                        <div>
                          <p>{new Date(p.paymentDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          <p className="text-xs text-gray-400">{new Date(p.paymentDate).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">₱{p.amount?.toLocaleString('en-PH')}</td>
                    <td className="px-5 py-4">
                      {editingStatus?.id === p.paymentId ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingStatus?.status ?? ''}
                            onChange={e => setEditingStatus({ id: p.paymentId, status: e.target.value })}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                          </select>
                          <button onClick={() => handleSaveStatus(p.paymentId)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all">Save</button>
                          <button onClick={() => setEditingStatus(null)} className="px-3 py-1 border border-gray-300 hover:border-gray-400 text-gray-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                            Back
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status={p.paymentStatus} />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingStatus({ id: p.paymentId, status: p.paymentStatus })}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >Edit</button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => handleDeletePayment(p.paymentId, p.paymentReference)}
                          className="text-xs text-red-500 hover:underline font-semibold"
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedPayments.length === 0 && (
              <div className="text-center py-14">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <p className="text-gray-400 text-sm font-medium">
                  {paymentSearch || paymentStatusFilter !== 'All'
                    ? `No payments matching your filters`
                    : 'No payments found.'}
                </p>
                {(paymentSearch || paymentStatusFilter !== 'All') && (
                  <button onClick={() => { setPaymentSearch(''); setPaymentStatusFilter('All'); }} className="mt-2 text-xs text-blue-600 hover:underline font-semibold">Clear filters</button>
                )}
              </div>
            )}
          </div>
          <div className="mt-4">
            <button
              onClick={() => setTab('dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Back to Dashboard
            </button>
          </div>
          </>
        )}

        {/* ── Memberships Tab ── */}
        {!loading && tab === 'memberships' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={openAddPlan}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
              >
                + Add Plan
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {([
                      { label: 'ID',       field: 'id'       },
                      { label: 'Name',     field: 'name'     },
                      { label: 'Duration', field: 'duration' },
                      { label: 'Price',    field: 'price'    },
                    ] as const).map(({ label, field }) => (
                      <th key={field} className="px-5 py-4 text-left">
                        <button onClick={() => toggleSort(planSort, field, setPlanSort)} className="flex items-center gap-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                          {label}<SortArrow field={field} sort={planSort} />
                        </button>
                      </th>
                    ))}
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlans.map((m: any, idx: number) => (
                    <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${idx < sortedPlans.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <td className="px-5 py-4 text-sm text-gray-400">{m.id}</td>
                      <td className="px-5 py-4 text-sm text-gray-900 font-semibold">{m.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{m.durationMonths} {m.durationMonths === 1 ? 'month' : 'months'}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">₱{Number(m.price).toLocaleString('en-PH')}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">{m.description}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditPlan(m)} className="text-xs text-blue-600 hover:underline font-semibold">Edit</button>
                          <span className="text-gray-200">|</span>
                          <button onClick={() => handleDeletePlan(m.id, m.name)} className="text-xs text-red-500 hover:underline font-semibold">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {memberships.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No plans found.</p>}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setTab('dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl text-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── User Detail Modal ── */}
      {viewUser && (() => {
        const ini = `${viewUser.firstname?.[0] ?? ''}${viewUser.lastname?.[0] ?? ''}`.toUpperCase() || '?';
        const userPayments = payments.filter((p: any) => p.userEmail === viewUser.email);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setViewUser(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900">User Profile</h2>
                <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {/* Avatar + info */}
                <div className="flex items-center gap-4">
                  {viewUser.profilePicture ? (
                    <img src={viewUser.profilePicture} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-black shadow">{ini}</div>
                  )}
                  <div>
                    <p className="font-black text-gray-900 text-lg leading-tight">{viewUser.firstname} {viewUser.lastname}</p>
                    <p className="text-gray-500 text-sm">{viewUser.email}</p>
                    <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${viewUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>{viewUser.role}</span>
                  </div>
                </div>
                {/* Info rows */}
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Account ID</span><span className="font-semibold text-gray-800">#{viewUser.id}</span></div>
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Joined</span><span className="font-semibold text-gray-800">{viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Total Payments</span><span className="font-semibold text-gray-800">{userPayments.length}</span></div>
                  <div className="flex justify-between px-4 py-3"><span className="text-gray-500">Total Spent</span><span className="font-semibold text-blue-600">₱{userPayments.filter((p: any) => p.paymentStatus?.toUpperCase() === 'COMPLETED').reduce((s: number, p: any) => s + (p.amount ?? 0), 0).toLocaleString('en-PH')}</span></div>
                </div>
                {/* Payment history */}
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
                <button onClick={() => setViewUser(null)} className="w-full py-2.5 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm transition-all">Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Plan Form Modal ── */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-black text-gray-900 mb-5">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Name <span className="text-red-500">*</span></label>
                <input
                  value={planForm.name}
                  onChange={e => { setPlanForm({ ...planForm, name: e.target.value }); setPlanErrors(prev => ({ ...prev, name: '' })); }}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${planErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                  placeholder="e.g. Premium"
                />
                {planErrors.name && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {planErrors.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (months) <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="1"
                    value={planForm.durationMonths}
                    onChange={e => { setPlanForm({ ...planForm, durationMonths: e.target.value }); setPlanErrors(prev => ({ ...prev, durationMonths: '' })); }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${planErrors.durationMonths ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                    placeholder="1"
                  />
                  {planErrors.durationMonths && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {planErrors.durationMonths}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₱) <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="0" step="0.01"
                    value={planForm.price}
                    onChange={e => { setPlanForm({ ...planForm, price: e.target.value }); setPlanErrors(prev => ({ ...prev, price: '' })); }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${planErrors.price ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                    placeholder="1500"
                  />
                  {planErrors.price && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {planErrors.price}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
                <textarea
                  value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Plan description..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPlanForm(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:border-gray-400 transition-all">Cancel</button>
              <button onClick={handleSavePlan} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} confirmLabel={confirm.confirmLabel} confirmColor={confirm.confirmColor} />}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
