import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { membershipAPI, membershipAdminAPI } from './membershipApi';
import { useAuth } from '../auth/AuthContext';
import type { MembershipPlan } from '../../shared/types';

const PLAN_META: Record<string, { border: string; badge: string; btnClass: string; perks: string[] }> = {
  Basic: {
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    btnClass: 'border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600',
    perks: ['Gym floor access', 'Locker room access', 'Basic equipment', '1 guest pass/month'],
  },
  Premium: {
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    perks: ['Everything in Basic', 'Group classes', 'Personal trainer (2x/mo)', 'Unlimited guest passes', 'Pool access'],
  },
  Annual: {
    border: 'border-purple-400',
    badge: 'bg-purple-600 text-white',
    btnClass: 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm',
    perks: ['Everything in Premium', 'Priority booking', 'Nutrition consultation', 'Free merchandise', 'Best value'],
  },
};

const CheckIcon = () => (
  <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
  </svg>
);

const MembershipPlans = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState<number | null>(null);

  // Admin plan management state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', durationMonths: '', price: '', description: '' });
  const [planErrors, setPlanErrors] = useState({ name: '', durationMonths: '', price: '' });
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!error) return; const t = setTimeout(() => setError(''), 3000); return () => clearTimeout(t); }, [error]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    membershipAPI.getPlans()
      .then(res => setPlans(res.data.data || []))
      .catch(() => setError('Failed to load membership plans. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (plan: MembershipPlan) => {
    setSelecting(plan.id);
    setTimeout(() => navigate('/payments/new', { state: { plan } }), 300);
  };

  // ── Admin handlers ──────────────────────────────────────────────────────────
  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', durationMonths: '', price: '', description: '' });
    setPlanErrors({ name: '', durationMonths: '', price: '' });
    setShowPlanForm(true);
  };

  const openEditPlan = (plan: MembershipPlan) => {
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
    setSaving(true);
    try {
      if (editingPlan) {
        const res = await membershipAdminAPI.update(editingPlan.id, payload);
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? res.data.data : p));
        showToast('Plan updated successfully.');
      } else {
        const res = await membershipAdminAPI.create(payload);
        setPlans(prev => [...prev, res.data.data]);
        showToast('Plan created successfully.');
      }
      setShowPlanForm(false);
    } catch {
      setError('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = (plan: MembershipPlan) => {
    setConfirm({
      message: `Delete plan "${plan.name}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await membershipAdminAPI.delete(plan.id);
          setPlans(prev => prev.filter(p => p.id !== plan.id));
          showToast('Plan deleted.');
        } catch {
          setError('Failed to delete plan.');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl text-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
        </div>

        {/* Admin management bar */}
        {isAdmin && (
          <div className="mb-8 px-5 py-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Admin — Plan Management</p>
                <p className="text-xs text-blue-600 mt-0.5">Add, edit, or delete membership plans. Members see these plans when subscribing.</p>
              </div>
            </div>
            <button
              onClick={openAddPlan}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Add Plan
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full">
            Membership Plans
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Plan
            </span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
            Select the membership that fits your goals. All plans include full gym access.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.name] || PLAN_META.Basic;
              const isPopular = plan.name === 'Premium';

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white border-2 ${meta.border} rounded-2xl p-7 flex flex-col shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{plan.name}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${meta.badge}`}>
                      {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}
                    </span>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-gray-400 text-sm">₱</span>
                      <span className="text-4xl font-black text-gray-900">
                        {plan.price.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      ≈ ₱{(plan.price / plan.durationMonths).toLocaleString('en-PH', { maximumFractionDigits: 0 })}/month
                    </p>
                  </div>

                  <p className="text-gray-500 text-sm mb-5">{plan.description}</p>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {meta.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckIcon />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {isAdmin ? (
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => openEditPlan(plan)}
                        className="flex-1 py-2.5 border border-blue-300 hover:border-blue-500 text-blue-600 hover:bg-blue-50 font-bold rounded-xl text-sm transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="flex-1 py-2.5 border border-red-200 hover:border-red-400 text-red-500 hover:bg-red-50 font-bold rounded-xl text-sm transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelect(plan)}
                      disabled={selecting === plan.id}
                      className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${meta.btnClass} ${selecting === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {selecting === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Selecting...
                        </span>
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add plan card for admin when there are plans */}
            {isAdmin && (
              <button
                onClick={openAddPlan}
                className="bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-2xl p-7 flex flex-col items-center justify-center gap-3 transition-all group min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                </div>
                <p className="text-gray-400 group-hover:text-blue-600 font-semibold text-sm transition-colors">Add New Plan</p>
              </button>
            )}
          </div>
        )}

        {!loading && plans.length === 0 && !error && !isAdmin && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No membership plans available.</p>
            <p className="text-sm mt-1">Please contact the gym administrator.</p>
          </div>
        )}

        {/* Bottom back button */}
        {!loading && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Back
            </button>
          </div>
        )}
      </div>

      {/* ── Plan Form Modal ── */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
              <button onClick={() => setShowPlanForm(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Name <span className="text-red-500">*</span></label>
                <input
                  value={planForm.name}
                  onChange={e => { setPlanForm({ ...planForm, name: e.target.value }); setPlanErrors(prev => ({ ...prev, name: '' })); }}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${planErrors.name ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                  placeholder="e.g. Premium"
                />
                {planErrors.name && <p className="mt-1 text-xs text-red-500">{planErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (months) <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="1"
                    value={planForm.durationMonths}
                    onChange={e => { setPlanForm({ ...planForm, durationMonths: e.target.value }); setPlanErrors(prev => ({ ...prev, durationMonths: '' })); }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${planErrors.durationMonths ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                    placeholder="1"
                  />
                  {planErrors.durationMonths && <p className="mt-1 text-xs text-red-500">{planErrors.durationMonths}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₱) <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="0" step="0.01"
                    value={planForm.price}
                    onChange={e => { setPlanForm({ ...planForm, price: e.target.value }); setPlanErrors(prev => ({ ...prev, price: '' })); }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${planErrors.price ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                    placeholder="1500"
                  />
                  {planErrors.price && <p className="mt-1 text-xs text-red-500">{planErrors.price}</p>}
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
              <button onClick={handleSavePlan} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                {saving ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-gray-800 font-semibold text-center mb-6">{confirm.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:border-gray-400 transition-all">Cancel</button>
              <button onClick={confirm.onConfirm} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default MembershipPlans;
