import { NavLink } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  BookMarked,
  BookOpen,
  Ellipsis,
  History,
  Library,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Trophy,
  User,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';
import { useTheme } from '../features/theme/useTheme';
import { PortraitImage } from '../features/portraits/portraitAssets';
import mothIcon from '../assets/moth_icon.png';

const NAV_ITEMS = [
  { to: '/library', icon: Library, label: 'Library', mobileLabel: 'Library' },
  { to: '/reading-lists', icon: BookMarked, label: 'Lists', mobileLabel: 'Lists' },
  { to: '/circles', icon: UsersRound, label: 'Circles', mobileLabel: 'Circles' },
  { to: '/codex', icon: BookOpen, label: 'Codex', mobileLabel: 'Codex' },
  { to: '/word-lookups', icon: History, label: 'Word History', mobileLabel: 'History' },
  { to: '/challenges', icon: Trophy, label: 'Challenges', mobileLabel: 'Play' },
  { to: '/profile', icon: User, label: 'Profile', mobileLabel: 'Profile' },
] as const;

export function BottomNav() {
  const { isAdmin, logout, profile, username } = useAuth();
  const { theme, toggle } = useTheme();
  const navItems = isAdmin
    ? [...NAV_ITEMS, { to: '/admin', icon: ShieldCheck, label: 'Admin', mobileLabel: 'Admin' }]
    : NAV_ITEMS;
  const nickname = profile?.nickname?.trim() || username || 'Reader';
  const handle = username ? `@${username}` : 'Lexipal profile';
  const isDark = theme === 'dark';
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface safe-area-inset-bottom lg:hidden">
        <div className="mx-auto flex h-16 max-w-[560px] items-center justify-around px-2">
          {navItems.map(({ to, icon: Icon, mobileLabel }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-[16px] px-2 py-2 transition-all duration-200 ${
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
                  <span className="text-xs font-medium">{mobileLabel}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-60 flex-col border-r border-border bg-surface px-5 py-7 shadow-[0_20px_48px_rgba(15,23,42,0.04)] lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] bg-brand text-text-on-brand shadow-[0_10px_22px_rgba(154,74,66,0.22)]">
            <img src={mothIcon} alt="Lexipal" className="h-7 w-7 object-contain" />
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
          {navItems.map(({ to, icon: Icon, label }) => (
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

        <div className="mt-auto">
          <div className="flex items-center gap-3 rounded-[22px] px-2 py-2.5 transition-colors hover:bg-surface-alt">
            <NavLink
              to="/profile"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <PortraitImage
                assetKey={profile?.selectedPortrait?.assetKey}
                name={profile?.selectedPortrait?.name ?? nickname}
                className="h-12 w-12 shrink-0 shadow-[0_10px_22px_rgba(31,41,55,0.12)]"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-text">{nickname}</span>
                <span className="mt-0.5 block truncate text-sm text-text-muted">{handle}</span>
              </span>
            </NavLink>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Open profile menu"
                >
                  <Ellipsis size={22} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  side="top"
                  sideOffset={10}
                  className="z-50 w-60 rounded-[22px] border border-border bg-surface p-2 shadow-[0_24px_54px_rgba(15,23,42,0.22)]"
                >
                  <DropdownMenu.Item
                    onSelect={toggle}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-[16px] px-3 py-3 text-sm font-medium text-text outline-none transition-colors hover:bg-surface-alt focus:bg-surface-alt"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface-muted text-text">
                        <ThemeIcon size={18} />
                      </span>
                      <span className="flex flex-col">
                        <span>Appearance</span>
                        <span className="text-xs font-normal text-text-muted">
                          {isDark ? 'Dark theme on' : 'Light theme on'}
                        </span>
                      </span>
                    </span>
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-1 h-px bg-border" />

                  <DropdownMenu.Item
                    onSelect={() => void logout()}
                    className="flex cursor-pointer items-center gap-3 rounded-[16px] px-3 py-3 text-sm font-medium text-danger outline-none transition-colors hover:bg-danger-soft focus:bg-danger-soft"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-danger-soft text-danger">
                      <LogOut size={18} />
                    </span>
                    Log out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </aside>
    </>
  );
}
