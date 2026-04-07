import { NavLink } from 'react-router-dom';
import { Library, BookOpen, Trophy, User } from 'lucide-react';

export function BottomNav() {
  const navItems = [
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/codex', icon: BookOpen, label: 'Codex' },
    { to: '/challenges', icon: Trophy, label: 'Challenges' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[rgba(0,0,0,0.08)] safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-[480px] mx-auto px-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-[16px] transition-all duration-200 ${
                isActive
                  ? 'text-[#A8E6CF]'
                  : 'text-[#6C757D] hover:text-[#2C3E50]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'scale-110' : ''}
                />
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
