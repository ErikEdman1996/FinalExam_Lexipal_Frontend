import { NavLink } from 'react-router-dom';
import { BookOpen, Library, Sparkles, Trophy, User } from 'lucide-react';
import { ThemeToggle } from '../features/theme/ThemeToggle.tsx';

const NAV_ITEMS = [
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/codex', icon: BookOpen, label: 'Codex' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const;

export function BottomNav() {
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface safe-area-inset-bottom lg:hidden">
        <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around px-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-[16px] px-4 py-2 transition-all duration-200 ${
                  isActive ? 'text-brand' : 'text-text-muted hover:text-text'
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

      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-60 flex-col border-r border-border bg-surface px-5 py-7 shadow-[0_20px_48px_rgba(15,23,42,0.04)] lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-brand text-text-on-brand shadow-[0_10px_22px_rgba(154,74,66,0.22)]">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[0.66rem] font-medium uppercase tracking-[0.28em] text-text-subtle">
              Reading app
            </p>
            <p className="mt-0.5 text-base font-semibold tracking-[-0.02em] text-text">
              Lexipal
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1">
          <p className="px-3 pb-2 text-[0.66rem] font-medium uppercase tracking-[0.28em] text-text-subtle">
            Menu
          </p>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand text-text-on-brand shadow-[0_10px_22px_rgba(154,74,66,0.22)]'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] transition-colors ${
                      isActive
                        ? 'bg-white/25 text-text-on-brand'
                        : 'bg-surface-muted text-text group-hover:bg-surface'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <ThemeToggle variant="row" />
        </div>
      </aside>
    </>
  );
}
