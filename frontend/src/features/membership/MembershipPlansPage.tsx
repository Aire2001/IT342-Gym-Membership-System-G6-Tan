import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { membershipAPI } from './membershipApi';
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
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState<number | null>(null);

  useEffect(() => {
    membershipAPI.getPlans()
      .then(res => setPlans(res.data.data || []))
      .catch(() => setError('Failed to load membership plans. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (plan: MembershipPlan) => {
    setSelecting(plan.id);
    setTimeout(() => {
      navigate('/payments/new', { state: { plan } });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={selecting === plan.id}
                    className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all
                      ${meta.btnClass}
                      ${selecting === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                </div>
              );
            })}
          </div>
        )}

        {!loading && plans.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No membership plans available.</p>
            <p className="text-sm mt-1">Please contact the gym administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPlans;
