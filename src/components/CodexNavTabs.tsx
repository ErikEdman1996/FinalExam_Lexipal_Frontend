import { BookOpen, History } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const CODEX_SECTIONS = [
  { to: '/codex', label: 'Codex', icon: BookOpen },
  { to: '/word-lookups', label: 'History', icon: History },
] as const;

interface CodexNavTabsProps {
  className?: string;
}

export function CodexNavTabs({ className = '' }: CodexNavTabsProps) {
  return (
    <nav
      aria-label="Codex sections"
      className={`inline-flex w-full gap-1 rounded-full border border-border bg-surface-muted p-1 sm:w-fit ${className}`.trim()}
    >
      {CODEX_SECTIONS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors sm:flex-none ${
              isActive
                ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.22)]'
                : 'text-text-muted hover:text-text'
            }`
          }
        >
          <Icon size={16} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
