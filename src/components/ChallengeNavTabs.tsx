import { History, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const CHALLENGE_SECTIONS = [
  { to: '/challenges', label: 'Challenges', icon: Trophy, end: true },
  { to: '/word-lookups', label: 'Looked-up Words', icon: History, end: false },
] as const;

interface ChallengeNavTabsProps {
  className?: string;
}

export function ChallengeNavTabs({ className = '' }: ChallengeNavTabsProps) {
  return (
    <nav
      aria-label="Challenge sections"
      className={`inline-flex w-full gap-1 rounded-full border border-border bg-surface-muted p-1 sm:w-fit ${className}`.trim()}
    >
      {CHALLENGE_SECTIONS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `inline-flex min-h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors sm:flex-none ${
              isActive
                ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.22)]'
                : 'text-text-muted hover:text-text'
            }`
          }
        >
          <Icon size={16} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
