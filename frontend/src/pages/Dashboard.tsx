import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DashboardData } from '../types';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Expired: 'bg-red-100 text-red-600 border-red-200',
    Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Failed: 'bg-red-100 text-red-600 border-red-200',
    'N/A': 'bg-gray-100 text-gray-400 border-gray-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.getData()
      .then(res => setData(res.data.data))
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const daysLeft = data?.expirationDate
    ? Math.max(0, Math.ceil((new Date(data.expirationDate).getTime() - Date.now()) / 86400000))
    : null;

  const daysActive = data?.startDate
    ? Math.max(0, Math.ceil((Date.now() - new Date(data.startDate).getTime()) / 86400000))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {user?.firstname || user?.email?.split('@')[0]}
            </span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here's your membership overview for today.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-400" />
                <div className="p-6">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Total Payments</p>
                  <p className="text-4xl font-black text-gray-900">{data.totalPayments ?? 0}</p>
                  <p className="text-blue-500 text-xs mt-2 font-medium">All time transactions</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
                <div className="p-6">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Total Spent</p>
                  <p className="text-4xl font-black text-gray-900">
                    ₱{(data.totalSpent ?? 0).toLocaleString('en-PH')}
                  </p>
                  <p className="text-purple-500 text-xs mt-2 font-medium">Completed payments only</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
                <div className="p-6">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Active Days</p>
                  <p className="text-4xl font-black text-gray-900">{daysActive}</p>
                  <p className="text-emerald-600 text-xs mt-2 font-medium">Since membership start</p>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Membership</p>
                <p className="text-lg font-bold text-gray-900 mb-2">{data.membershipName || '—'}</p>
                <StatusBadge status={data.membershipStatus} />
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Membership Period</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Start</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {data.startDate
                      ? new Date(data.startDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Expires</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {data.expirationDate
                      ? new Date(data.expirationDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </p>
                  {daysLeft !== null && (
                    <p className={`text-xs font-medium mt-1 ${daysLeft <= 7 ? 'text-red-500' : 'text-gray-400'}`}>
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Last Payment</p>
                <p className="text-sm font-semibold text-gray-800 mb-2">Payment Status</p>
                <StatusBadge status={data.paymentStatus || 'N/A'} />
                {data.lastPaymentDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(data.lastPaymentDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {/* Membership Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Membership Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Plan</p>
                  <p className="text-gray-900 font-bold text-sm">{data.membershipName || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Price</p>
                  <p className="text-gray-900 font-bold text-sm">₱{data.membershipPrice?.toLocaleString('en-PH') ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-gray-900 font-bold text-sm">
                    {data.membershipDurationMonths
                      ? `${data.membershipDurationMonths} ${data.membershipDurationMonths === 1 ? 'month' : 'months'}`
                      : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Description</p>
                  <p className="text-gray-900 font-bold text-sm">{data.membershipDescription || '—'}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/memberships')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all text-sm shadow-sm"
                >
                  {data.membershipStatus === 'Active' ? 'Upgrade Plan' : 'Get Membership'}
                </button>
                <button
                  onClick={() => navigate('/payments/history')}
                  className="px-6 py-2.5 border border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all text-sm"
                >
                  View Payment History
                </button>
              </div>
            </div>
          </>
        )}

        {!loading && !data && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <p className="text-gray-700 text-lg font-bold mb-1">No membership found.</p>
            <p className="text-gray-400 text-sm mb-6">Browse our plans to get started on your fitness journey.</p>
            <button
              onClick={() => navigate('/memberships')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              Browse Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
