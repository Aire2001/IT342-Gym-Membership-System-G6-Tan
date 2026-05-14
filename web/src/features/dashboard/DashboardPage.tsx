import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from './dashboardApi';
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

// ── Member dashboard ──────────────────────────────────────────────────────────

const MemberDashboard = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);

  useEffect(() => { if (!error) return; const t = setTimeout(() => setError(''), 3000); return () => clearTimeout(t); }, [error]);

  useEffect(() => {
    dashboardAPI.getData()
      .then(res => setData(res.data.data))
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));

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

// ── Root component — members only; admins redirect to /admin ──────────────────

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, navigate]);

  if (isAdmin) return null;
  return <MemberDashboard user={user} />;
};

export default Dashboard;
