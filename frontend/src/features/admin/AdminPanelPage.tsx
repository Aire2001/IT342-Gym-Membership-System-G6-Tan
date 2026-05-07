import { useEffect, useState } from 'react';
import { adminAPI } from './adminApi';
import { membershipAPI, membershipAdminAPI } from '../membership/membershipApi';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

type Tab = 'users' | 'payments' | 'memberships';

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

const ConfirmDialog = ({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
      <p className="text-gray-800 font-semibold text-center mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:border-gray-400 transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all">Delete</button>
      </div>
    </div>
  </div>
);

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState('');

  // Membership form state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', durationMonths: '', price: '', description: '' });

  // User role edit state
  const [editingRole, setEditingRole] = useState<{ id: number; role: string } | null>(null);

  // Payment status edit state
  const [editingStatus, setEditingStatus] = useState<{ id: number; status: string } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    Promise.all([adminAPI.getUsers(), adminAPI.getPayments(), membershipAPI.getPlans()])
      .then(([u, p, m]) => {
        setUsers(u.data.data || []);
        setPayments(p.data.data || []);
        setMemberships(m.data.data || []);
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

  const handleSaveRole = async (id: number) => {
    if (!editingRole) return;
    await adminAPI.updateUserRole(id, editingRole.role);
    setUsers(u => u.map(x => x.id === id ? { ...x, role: editingRole.role } : x));
    setEditingRole(null);
    showToast('Role updated.');
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

  const handleSaveStatus = async (id: number) => {
    if (!editingStatus) return;
    await adminAPI.updatePaymentStatus(id, editingStatus.status);
    setPayments(p => p.map(x => x.paymentId === id ? { ...x, paymentStatus: editingStatus.status.toUpperCase() } : x));
    setEditingStatus(null);
    showToast('Payment status updated.');
  };

  // ── Memberships ────────────────────────────────────────────────────────────
  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', durationMonths: '', price: '', description: '' });
    setShowPlanForm(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({ name: plan.name, durationMonths: String(plan.durationMonths), price: String(plan.price), description: plan.description });
    setShowPlanForm(true);
  };

  const handleSavePlan = async () => {
    const payload = {
      name: planForm.name.trim(),
      durationMonths: parseInt(planForm.durationMonths),
      price: parseFloat(planForm.price),
      description: planForm.description.trim(),
    };
    if (!payload.name || !payload.durationMonths || !payload.price) return;
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

  const TABS: { key: Tab; label: string }[] = [
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
          <p className="text-gray-400 text-sm mt-1">Full control — create, read, update, delete.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Users', value: users.length, gradient: 'from-blue-500 to-indigo-500' },
            { label: 'Total Payments', value: payments.length, gradient: 'from-purple-500 to-pink-500' },
            { label: 'Membership Plans', value: memberships.length, gradient: 'from-emerald-500 to-teal-400' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden relative">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`} />
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 mt-1">{s.label}</p>
              <p className="text-3xl font-black text-gray-900">{s.value}</p>
            </div>
          ))}
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

        {/* ── Users Tab ── */}
        {!loading && tab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['ID', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, idx: number) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${idx < users.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <td className="px-5 py-4 text-sm text-gray-400">{u.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">{u.firstname} {u.lastname}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-4">
                      {editingRole?.id === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole.role}
                            onChange={e => setEditingRole({ id: u.id, role: e.target.value })}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button onClick={() => handleSaveRole(u.id)} className="text-xs text-blue-600 font-bold hover:underline">Save</button>
                          <button onClick={() => setEditingRole(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
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
            {users.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No users found.</p>}
          </div>
        )}

        {/* ── Payments Tab ── */}
        {!loading && tab === 'payments' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Ref #', 'User', 'Plan', 'Method', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any, idx: number) => (
                  <tr key={p.paymentId} className={`hover:bg-gray-50 transition-colors ${idx < payments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <td className="px-5 py-4 text-xs font-mono text-gray-600">{p.paymentReference}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">{p.userEmail}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{p.membershipName || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{p.paymentMethod}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">₱{p.amount?.toLocaleString('en-PH')}</td>
                    <td className="px-5 py-4">
                      {editingStatus?.id === p.paymentId ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingStatus.status}
                            onChange={e => setEditingStatus({ id: p.paymentId, status: e.target.value })}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                          </select>
                          <button onClick={() => handleSaveStatus(p.paymentId)} className="text-xs text-blue-600 font-bold hover:underline">Save</button>
                          <button onClick={() => setEditingStatus(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
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
            {payments.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No payments found.</p>}
          </div>
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
                    {['ID', 'Name', 'Duration', 'Price', 'Description', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((m: any, idx: number) => (
                    <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${idx < memberships.length - 1 ? 'border-b border-gray-100' : ''}`}>
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
          </>
        )}
      </div>

      {/* ── Plan Form Modal ── */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-black text-gray-900 mb-5">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Name</label>
                <input
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Premium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (months)</label>
                  <input
                    type="number" min="1"
                    value={planForm.durationMonths}
                    onChange={e => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₱)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="1500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
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
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

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
