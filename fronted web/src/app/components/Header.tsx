import { Dumbbell } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function Header() {
  const { user } = useAuth();

  const getInitials = () => {
    return `${user?.firstname?.[0] || ''}${user?.lastname?.[0] || ''}`.toUpperCase();
  };

  return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-2 shadow-md">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  FitLife Gym
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Membership Portal</p>
              </div>
            </Link>

            {/* User Profile Section - CLICKABLE VERSION */}
            {user && (
                <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {/* Profile Picture / Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                    <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${user.firstname}+${user.lastname}&background=3b82f6&color=fff&bold=true&size=40`}
                        alt={`${user.firstname} ${user.lastname}`}
                    />
                    <AvatarFallback className="bg-blue-500 text-white font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Name and Role */}
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-700">{user.firstname} {user.lastname}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </Link>
            )}
          </div>
        </div>
      </header>
  );
}