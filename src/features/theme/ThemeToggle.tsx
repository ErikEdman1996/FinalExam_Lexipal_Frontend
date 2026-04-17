import { Moon, Sun } from 'lucide-react';
import { useTheme } from './useTheme';

type ThemeToggleVariant = 'compact' | 'row';

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className = '' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;
  const nextLabel = isDark ? 'Switch to light' : 'Switch to dark';

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={nextLabel}
        className={`flex w-full items-center justify-between gap-3 rounded-[18px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-[0_10px_22px_rgba(31,41,55,0.05)] transition-colors hover:bg-surface-alt ${className}`.trim()}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface-muted text-text">
            <Icon size={18} />
          </span>
          <span className="flex flex-col items-start">
            <span>Appearance</span>
            <span className="text-xs font-normal text-text-muted">
              {isDark ? 'Dark theme on' : 'Light theme on'}
            </span>
          </span>
        </span>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      title={nextLabel}
      className={`flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-surface text-text transition-colors hover:bg-surface-alt ${className}`.trim()}
    >
      <Icon size={18} />
    </button>
  );
}
