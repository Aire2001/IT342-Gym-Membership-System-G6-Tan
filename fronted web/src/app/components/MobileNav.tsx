import { Home, CreditCard, History, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from './ui/utils';

export function MobileNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: CreditCard, label: 'Membership', path: '/memberships' },
    { icon: History, label: 'History', path: '/payment-history' },
    { icon: User, label: 'Profile', path: '/dashboard' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors",
                isActive ? "text-primary" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
