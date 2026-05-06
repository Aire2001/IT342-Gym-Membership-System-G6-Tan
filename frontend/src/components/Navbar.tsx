import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-500 hover:text-blue-600 transition-colors';

  const initials = user
    ? `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : '';

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
              </svg>
            </div>
            <div>
              <p className="text-gray-900 font-black text-lg leading-none tracking-tight">FitLife Gym</p>
              <p className="text-gray-400 text-xs leading-none">Membership Portal</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/dashboard" className={`pb-1 ${isActive('/dashboard')}`}>Dashboard</Link>
            <Link to="/memberships" className={`pb-1 ${isActive('/memberships')}`}>Plans</Link>
            <Link to="/payments/history" className={`pb-1 ${isActive('/payments/history')}`}>History</Link>
            {isAdmin && (
              <Link to="/admin" className={`pb-1 ${isActive('/admin')}`}>Admin</Link>
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
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow">
                  {initials}
                </div>
              )}
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
              onClick={handleLogout}
              className="px-4 py-1.5 text-sm font-semibold border border-gray-300 text-gray-600 rounded-lg hover:border-red-400 hover:text-red-500 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
