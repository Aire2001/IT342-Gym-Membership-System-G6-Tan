import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'))
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-500 hover:text-blue-600 transition-colors';

  const initials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase() ||
      (user.email?.[0]?.toUpperCase() ?? '')
    : '';

  if (!user) return null;

  return (
    <>
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
              </svg>
            </div>
            <div>
              <p className="text-gray-900 font-black text-lg leading-none tracking-tight">FitLife Gym</p>
              <p className="text-blue-500 text-xs leading-none font-mono mt-0.5">
                {now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                <span className="text-gray-400 ml-1">
                  {now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6 text-sm font-semibold">
            {isAdmin ? (
              <>
                <Link to="/admin" className={`pb-1 ${isActive('/admin')}`}>Dashboard</Link>
                <Link to="/memberships" className={`pb-1 ${isActive('/memberships')}`}>Plans</Link>
                <Link to="/admin?tab=payments" className={`pb-1 ${isActive('/admin?tab=payments')}`}>Payments</Link>
                <Link to="/admin?tab=users" className={`pb-1 ${isActive('/admin?tab=users')}`}>Users</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={`pb-1 ${isActive('/dashboard')}`}>Dashboard</Link>
                <Link to="/memberships" className={`pb-1 ${isActive('/memberships')}`}>Plans</Link>
                <Link to="/payments/history" className={`pb-1 ${isActive('/payments/history')}`}>History</Link>
              </>
            )}
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 shadow"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }}
                />
              ) : null}
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow"
                style={{ display: user.profilePicture ? 'none' : 'flex' }}
              >
                {initials}
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-gray-800 text-sm font-semibold leading-none">
                  {user.firstname && user.lastname
                    ? `${user.firstname} ${user.lastname}`
                    : user.email}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {user.role === 'ADMIN' ? (
                    <span className="text-purple-600 font-bold">Admin</span>
                  ) : 'Member'}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-1.5 text-sm font-semibold border border-gray-300 text-gray-600 rounded-lg hover:border-red-400 hover:text-red-500 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Logout confirm modal */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 text-center mb-1">Sign Out</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Are you sure you want to log out of FitLife Gym?</p>
          <div className="flex gap-3">
            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl text-sm transition-all">
              Cancel
            </button>
            <button onClick={handleLogout} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
              Yes, Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;
