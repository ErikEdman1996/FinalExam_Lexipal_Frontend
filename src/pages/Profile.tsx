import { useEffect, useMemo, useState, useSyncExternalStore, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Coins,
  Flame,
  Images,
  LockKeyhole,
  LogOut,
  Paintbrush,
  Snowflake,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { AppDialog } from '../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
  inputClassName,
} from '../components/form/inputStyles';
import { useAuth } from '../features/auth/useAuth';
import { PortraitImage } from '../features/portraits/portraitAssets';
import { formatLongDate, formatMonthDay } from '../utils/formatting';
import {
  ApiResponseError,
  ApiValidationError,
  getMyAchievements,
  getMyPortraits,
  getProfile,
  getProfileReadingSeries,
  getStreakLeaderboard,
  selectPortrait,
  updateNickname,
  type AchievementResponseDTO,
  type DailyActivityReadResponseDTO,
  type LeaderboardLimit,
  type PortraitResponseDTO,
  type ProfileReadingSeriesBucketType,
  type ProfileReadingSeriesRange,
  type ProfileReadingSeriesResponseDTO,
  type ProfileReadResponseDTO,
  type ProfileStatsResponseDTO,
  type StreakLeaderboardResponseDTO,
} from '../api/api';
import { DailyQuestCard } from '../features/dailyQuests/DailyQuestCard';

const NICKNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

type AchievementFilter = 'all' | 'unlocked' | 'locked';

const ACHIEVEMENT_FILTERS: { value: AchievementFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'locked', label: 'Locked' },
];

type ProfileTab = 'overview' | 'stats' | 'leaderboard' | 'achievements';

const PROFILE_DESKTOP_QUERY = '(min-width: 640px)';

const PROFILE_TABS: { value: ProfileTab; label: string; mobileOnly?: boolean }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'stats', label: 'Stats', mobileOnly: true },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'achievements', label: 'Achievements' },
];

const LEADERBOARD_LIMIT_OPTIONS = [10, 50, 100] as const satisfies readonly LeaderboardLimit[];
const DEFAULT_READING_SERIES_RANGE: ProfileReadingSeriesRange = 'THIS_WEEK';

const READING_SERIES_RANGE_OPTIONS: Array<{ key: ProfileReadingSeriesRange; label: string }> = [
  { key: 'THIS_WEEK', label: 'This week' },
  { key: 'THIS_MONTH', label: 'This month' },
  { key: 'THIS_YEAR', label: 'This year' },
  { key: 'ALL_TIME', label: 'All time' },
];

const numberFormatter = new Intl.NumberFormat(undefined);
const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const dayBucketFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const monthBucketFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });

type ReadingSeriesCache = Partial<Record<ProfileReadingSeriesRange, ProfileReadingSeriesResponseDTO>>;
type ReadingSeriesErrors = Partial<Record<ProfileReadingSeriesRange, string | null>>;

interface ReadingChartPoint {
  date: string;
  label: string;
  pagesRead: number;
  cumulativePagesRead: number;
}

const getIsProfileDesktop = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia(PROFILE_DESKTOP_QUERY).matches
);

const subscribeToProfileDesktopQuery = (onStoreChange: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(PROFILE_DESKTOP_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);

  return () => mediaQuery.removeEventListener('change', onStoreChange);
};

function useIsProfileDesktop() {
  return useSyncExternalStore(subscribeToProfileDesktopQuery, getIsProfileDesktop, () => true);
}

interface ProfileTabsProps {
  active: ProfileTab;
  unlockedCount: number;
  totalCount: number;
  onChange: (next: ProfileTab) => void;
}

function ProfileTabs({ active, unlockedCount, totalCount, onChange }: ProfileTabsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-[22px] border border-border bg-surface p-1 shadow-[0_8px_18px_rgba(31,41,55,0.04)] sm:flex sm:w-fit sm:rounded-full">
      {PROFILE_TABS.map((tab) => {
        const isActive = tab.value === active;
        const showBadge = tab.value === 'achievements' && totalCount > 0;
        const visibilityClassName = tab.mobileOnly ? 'sm:hidden' : '';

        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.value)}
            className={`${visibilityClassName} inline-flex min-w-0 items-center justify-center gap-1.5 rounded-[18px] px-3 py-2.5 text-xs font-medium leading-none transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:flex-none sm:rounded-full sm:px-4 sm:py-2 sm:text-sm ${
              isActive
                ? 'bg-brand text-text-on-brand shadow-[0_6px_14px_rgba(154,74,66,0.24)]'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span className="min-w-0 truncate">{tab.label}</span>
            {showBadge ? (
              <span className={`hidden shrink-0 text-xs sm:inline ${isActive ? 'text-text-on-brand/80' : 'text-text-subtle'}`}>
                {unlockedCount}/{totalCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

const formatMemberSince = (value: string) => {
  return formatLongDate(value);
};

const formatActivityDate = (value: string) => {
  return formatMonthDay(value);
};

const formatStreakDays = (value: number) => {
  const safeValue = Math.max(0, value);
  return `${safeValue} ${safeValue === 1 ? 'day' : 'days'}`;
};

const formatNumber = (value: number) => {
  return numberFormatter.format(value);
};

const formatCompactNumber = (value: number) => {
  return compactNumberFormatter.format(value);
};

const formatReadingTime = (totalMinutes: number) => {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));

  if (safeMinutes < 60) {
    return `${safeMinutes}m`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

const parseDateOnly = (value: string) => {
  const [rawYear, rawMonth, rawDay] = value.split('-').map(Number);

  if (!rawYear || !rawMonth || !rawDay) {
    return null;
  }

  return new Date(rawYear, rawMonth - 1, rawDay);
};

const formatReadingSeriesDate = (value: string, bucketType: ProfileReadingSeriesBucketType) => {
  const date = parseDateOnly(value);

  if (!date) {
    return value;
  }

  return bucketType === 'MONTH'
    ? monthBucketFormatter.format(date)
    : dayBucketFormatter.format(date);
};

const toReadableActivityLabel = (activityType: string) => {
  return activityType
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const toReadableCategoryLabel = (category: string) => {
  return category
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Achievements';
};

const isNewUserProfile = (stats: ProfileStatsResponseDTO) => {
  return (
    stats.totalPagesRead === 0
    && stats.totalBooksRead === 0
    && stats.totalSessionsCompleted === 0
    && stats.totalXpEarned === 0
  );
};

interface ProfileStatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: 'brand' | 'accent';
  delayMs: number;
  className?: string;
  isCompact?: boolean;
}

function ProfileStatCard({
  label,
  value,
  icon: Icon,
  tone,
  delayMs,
  className,
  isCompact = false,
}: ProfileStatCardProps) {
  const toneClasses = tone === 'accent'
    ? {
      chip: 'bg-accent-soft',
      icon: 'text-accent-strong',
    }
    : {
      chip: 'bg-brand-soft',
      icon: 'text-brand-strong',
    };
  const cardClassName = [
    'rounded-[28px] border border-border bg-surface shadow-[0_14px_30px_rgba(31,41,55,0.06)]',
    isCompact ? 'flex flex-col justify-center p-4' : 'p-5',
    className,
  ].filter(Boolean).join(' ');
  const iconClassName = isCompact
    ? `flex h-11 w-11 items-center justify-center rounded-[14px] ${toneClasses.chip}`
    : `flex h-12 w-12 items-center justify-center rounded-[16px] ${toneClasses.chip}`;
  const valueClassName = isCompact
    ? 'mt-4 text-[1.75rem] font-semibold leading-none text-text'
    : 'mt-5 text-[2rem] font-semibold leading-none text-text';
  const iconSize = isCompact ? 20 : 22;

  return (
    <div
      className={cardClassName}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={iconClassName}>
        <Icon size={iconSize} className={toneClasses.icon} />
      </div>
      <p className={valueClassName}>{value}</p>
      <p className="mt-2 text-sm text-text-muted">{label}</p>
    </div>
  );
}

interface ReadingChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ReadingChartPoint }>;
}

function ReadingChartTooltip({ active, payload }: ReadingChartTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-[16px] border border-border bg-surface px-3 py-2 text-sm shadow-[0_14px_30px_rgba(31,41,55,0.12)]">
      <p className="font-semibold text-text">{point.label}</p>
      <p className="mt-1 text-text-muted">
        Read: <span className="font-medium text-text">{formatNumber(point.pagesRead)} pages</span>
      </p>
      <p className="text-text-muted">
        Total: <span className="font-medium text-text">{formatNumber(point.cumulativePagesRead)} pages</span>
      </p>
    </div>
  );
}

interface ReadingPagesChartCardProps {
  activeRange: ProfileReadingSeriesRange;
  chartData: ReadingChartPoint[];
  errorMessage: string | null;
  isLoading: boolean;
  series: ProfileReadingSeriesResponseDTO | null;
  totalPagesRead: number;
  onRangeChange: (range: ProfileReadingSeriesRange) => void;
  onRetry: () => void;
}

function ReadingPagesChartCard({
  activeRange,
  chartData,
  errorMessage,
  isLoading,
  series,
  totalPagesRead,
  onRangeChange,
  onRetry,
}: ReadingPagesChartCardProps) {
  const timezone = series?.timezone ?? 'Europe/Stockholm';
  const rangeLabel = series?.startDate && series.endDate
    ? `${formatReadingSeriesDate(series.startDate, series.bucketType)} - ${formatReadingSeriesDate(series.endDate, series.bucketType)}`
    : null;

  return (
    <div className="min-w-0 rounded-[28px] border border-border bg-surface p-5 shadow-[0_14px_30px_rgba(31,41,55,0.06)] sm:col-span-2 lg:col-span-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-accent-soft">
              <Target size={22} className="text-accent-strong" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-text-muted">Pages Read</p>
              <p className="mt-1 text-[2rem] font-semibold leading-none text-text">
                {formatNumber(totalPagesRead)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-subtle">
            {rangeLabel ? `${rangeLabel} - ` : ''}{timezone}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-[18px] border border-border bg-surface-muted p-1 sm:inline-grid sm:grid-cols-4 lg:shrink-0">
          {READING_SERIES_RANGE_OPTIONS.map((option) => {
            const isActive = option.key === activeRange;

            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={isActive}
                disabled={isLoading && isActive}
                onClick={() => onRangeChange(option.key)}
                className={`min-w-0 rounded-[14px] px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isActive
                    ? 'bg-brand text-text-on-brand'
                    : 'text-text-muted hover:text-text'
                } disabled:cursor-wait disabled:opacity-80`}
              >
                <span className="block truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 h-64 min-h-64">
        {errorMessage ? (
          <div className="flex h-full flex-col items-center justify-center rounded-[22px] bg-surface-muted px-4 text-center">
            <p className="text-sm font-medium text-text">{errorMessage}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-full bg-brand px-4 py-2 text-sm font-medium text-text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Retry
            </button>
          </div>
        ) : isLoading && chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[22px] bg-surface-muted px-4 text-sm text-text-muted">
            Loading reading trend...
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="var(--t-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                stroke="var(--t-text-subtle)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={14}
              />
              <YAxis
                stroke="var(--t-text-subtle)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactNumber(Number(value))}
                width={46}
                allowDecimals={false}
              />
              <Tooltip content={<ReadingChartTooltip />} cursor={{ stroke: 'var(--t-border)' }} />
              <Line
                type="monotone"
                dataKey="cumulativePagesRead"
                name="Pages read"
                stroke="var(--t-accent)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[22px] bg-surface-muted px-4 text-center text-sm text-text-muted">
            No reading data for this range yet.
          </div>
        )}
      </div>

      {isLoading && chartData.length > 0 ? (
        <p className="mt-3 text-xs text-text-subtle">Updating trend...</p>
      ) : null}
    </div>
  );
}

interface DetailCardProps {
  title: string;
  value: string;
  description: string;
}

function DetailCard({ title, value, description }: DetailCardProps) {
  return (
    <div className="rounded-[26px] border border-border bg-surface p-5 shadow-[0_12px_26px_rgba(31,41,55,0.05)]">
      <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">{title}</p>
      <p className="mt-3 text-lg font-semibold text-text">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}

interface RecentActivitySectionProps {
  activities: DailyActivityReadResponseDTO[];
}

function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  return (
    <section className="rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Recent Activity</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Latest milestones</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-accent-soft">
          <Zap size={20} className="text-accent-strong" />
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="mt-5 rounded-[22px] bg-surface-muted px-4 py-5 text-sm leading-relaxed text-text-muted">
          Your recent sessions and XP moments will appear here once you start reading.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {activities.slice(0, 4).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between gap-4 rounded-[22px] bg-surface-muted px-4 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{toReadableActivityLabel(activity.activityType)}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {formatActivityDate(activity.activityDate)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-strong">
                +{activity.xpEarned} XP
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface PortraitCollectionModalProps {
  isOpen: boolean;
  portraits: PortraitResponseDTO[];
  isLoading: boolean;
  errorMessage: string | null;
  selectingPortraitCode: string | null;
  onClose: () => void;
  onSelectPortrait: (portrait: PortraitResponseDTO) => void;
}

function PortraitCollectionModal({
  isOpen,
  portraits,
  isLoading,
  errorMessage,
  selectingPortraitCode,
  onClose,
  onSelectPortrait,
}: PortraitCollectionModalProps) {
  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Portrait collection"
      description="Choose any portrait you have unlocked."
      showCloseButton
      contentClassName="w-full max-w-3xl overflow-hidden rounded-t-[32px] border border-border bg-surface p-5 shadow-[0_26px_60px_rgba(15,23,42,0.22)] sm:rounded-[32px] sm:p-6"
    >
      <div className="mt-5 max-h-[72vh] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-52 rounded-[24px] bg-surface-muted" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="rounded-[24px] border border-border bg-surface-muted p-5 text-sm leading-relaxed text-text-muted">
            {errorMessage}
          </div>
        ) : portraits.length === 0 ? (
          <div className="rounded-[24px] border border-border bg-surface-muted p-5 text-sm leading-relaxed text-text-muted">
            Portraits will appear here once the collection is ready.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {portraits.map((portrait) => {
              const isSelecting = selectingPortraitCode === portrait.code;
              const isDisabled = !portrait.unlocked || portrait.selected || isSelecting || selectingPortraitCode != null;

              return (
                <button
                  key={portrait.code}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectPortrait(portrait)}
                  className={`group relative flex min-h-52 flex-col rounded-[24px] border p-3 text-left transition-[transform,box-shadow,border-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed ${
                    portrait.selected
                      ? 'border-brand bg-brand-soft shadow-[0_14px_30px_rgba(154,74,66,0.14)]'
                      : portrait.unlocked
                        ? 'border-border bg-surface-alt hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_14px_28px_rgba(31,41,55,0.08)]'
                        : 'border-border bg-surface-muted opacity-70'
                  }`}
                >
                  <span className="relative mx-auto mt-1 block w-24 sm:w-28">
                    <PortraitImage assetKey={portrait.assetKey} name={portrait.name} className="shadow-[0_12px_24px_rgba(31,41,55,0.12)]" />
                    {!portrait.unlocked ? (
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 text-white">
                        <LockKeyhole size={22} />
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-4 min-w-0">
                    <span className="block text-sm font-semibold leading-snug text-text">{portrait.name}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-text-muted">
                      {portrait.description}
                    </span>
                  </span>

                  <span className="mt-auto pt-4">
                    {portrait.selected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-text-on-brand">
                        <CheckCircle2 size={14} />
                        Selected
                      </span>
                    ) : portrait.unlocked ? (
                      <span className="inline-flex rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-brand-strong">
                        {isSelecting ? 'Choosing...' : 'Choose'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-text-muted">
                        <LockKeyhole size={13} />
                        Level {portrait.requiredLevel}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppDialog>
  );
}

interface AchievementsSectionProps {
  achievements: AchievementResponseDTO[];
  isLoading: boolean;
  errorMessage: string | null;
}

function AchievementsSection({ achievements, isLoading, errorMessage }: AchievementsSectionProps) {
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  const lockedCount = Math.max(0, achievements.length - unlockedCount);

  const filteredAchievements = useMemo(() => {
    if (filter === 'unlocked') {
      return achievements.filter((achievement) => achievement.unlocked);
    }

    if (filter === 'locked') {
      return achievements.filter((achievement) => !achievement.unlocked);
    }

    return achievements;
  }, [achievements, filter]);

  const groupedAchievements = useMemo(() => {
    const categoryMap = new Map<string, AchievementResponseDTO[]>();

    filteredAchievements.forEach((achievement) => {
      const categoryAchievements = categoryMap.get(achievement.category) ?? [];
      categoryAchievements.push(achievement);
      categoryMap.set(achievement.category, categoryAchievements);
    });

    return Array.from(categoryMap, ([category, items]) => ({ category, items }));
  }, [filteredAchievements]);

  return (
    <section className="mt-6 rounded-[30px] border border-border bg-surface p-5 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Achievements</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Milestones</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            Little markers for the reading path you are growing.
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-brand-soft">
          <Award size={21} className="text-brand-strong" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {ACHIEVEMENT_FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              filter === item.value
                ? 'bg-brand text-text-on-brand'
                : 'bg-surface-muted text-text-muted hover:bg-surface-alt hover:text-text'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-text-muted">
        <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong">{unlockedCount} unlocked</span>
        <span className="rounded-full bg-surface-muted px-3 py-1.5">{lockedCount} still ahead</span>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 rounded-[22px] bg-surface-muted" />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="mt-5 rounded-[22px] bg-surface-muted px-4 py-5 text-sm leading-relaxed text-text-muted">
          {errorMessage}
        </div>
      ) : achievements.length === 0 ? (
        <div className="mt-5 rounded-[22px] bg-surface-muted px-4 py-5 text-sm leading-relaxed text-text-muted">
          Achievements will appear here once the collection is ready.
        </div>
      ) : groupedAchievements.length === 0 ? (
        <div className="mt-5 rounded-[22px] bg-surface-muted px-4 py-5 text-sm leading-relaxed text-text-muted">
          No achievements match this filter yet.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groupedAchievements.map(({ category, items }) => (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-subtle">
                {toReadableCategoryLabel(category)}
              </h3>
              <div className="mt-3 space-y-3">
                {items.map((achievement) => {
                  const progressPercent = achievement.threshold > 0
                    ? Math.min((achievement.progress / achievement.threshold) * 100, 100)
                    : achievement.unlocked
                      ? 100
                      : 0;

                  return (
                    <article
                      key={achievement.code}
                      className={`rounded-[24px] border p-4 ${
                        achievement.unlocked
                          ? 'border-brand/25 bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-brand-soft)_100%)]'
                          : 'border-border bg-surface-alt'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${
                            achievement.unlocked ? 'bg-brand text-text-on-brand' : 'bg-surface-muted text-text-muted'
                          }`}
                        >
                          {achievement.unlocked ? <BadgeCheck size={20} /> : <LockKeyhole size={19} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h4 className="text-base font-semibold text-text">{achievement.title}</h4>
                              <p className="mt-1 text-sm leading-relaxed text-text-muted">{achievement.description}</p>
                            </div>
                            {achievement.unlocked ? (
                              <span className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-text-on-brand">
                                Complete
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4">
                            <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                              <div
                                className={`h-full rounded-full transition-[width] duration-500 ${
                                  achievement.unlocked ? 'bg-brand' : 'bg-accent'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-text-muted">
                              {achievement.unlocked
                                ? achievement.unlockedAt
                                  ? `Unlocked ${formatLongDate(achievement.unlockedAt)}`
                                  : 'Unlocked'
                                : `${achievement.progress} / ${achievement.threshold}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StreakLeaderboardSection() {
  const [limit, setLimit] = useState<LeaderboardLimit>(10);
  const [leaderboard, setLeaderboard] = useState<StreakLeaderboardResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const entries = leaderboard?.entries ?? [];

  useEffect(() => {
    let isCurrent = true;

    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getStreakLeaderboard(limit);

        if (!isCurrent) {
          return;
        }

        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading streak leaderboard:', error);

        if (!isCurrent) {
          return;
        }

        setLeaderboard(null);
        setErrorMessage(error instanceof ApiResponseError
          ? error.message
          : 'Could not load the leaderboard right now.');
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      isCurrent = false;
    };
  }, [limit]);

  return (
    <section className="mt-5 rounded-[24px] border border-border bg-surface p-4 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:mt-6 sm:rounded-[30px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Reading Streaks</p>
          <h2 className="mt-2 text-xl font-semibold text-text text-pretty sm:text-2xl">Streak Leaderboard</h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted sm:mt-2">
            See who's keeping their daily reading habit alive.
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brand-soft sm:h-12 sm:w-12 sm:rounded-[18px]">
          <Trophy size={20} className="text-brand-strong" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-3 gap-1 rounded-full bg-surface-muted p-1 sm:mt-5 sm:w-fit">
        {LEADERBOARD_LIMIT_OPTIONS.map((option) => {
          const isActive = option === limit;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              onClick={() => setLimit(option)}
              className={`rounded-full px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm ${
                isActive
                  ? 'bg-brand text-text-on-brand'
                  : 'bg-surface-muted text-text-muted hover:bg-surface-alt hover:text-text'
              }`}
            >
              Top {option}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3 sm:mt-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-14 rounded-[18px] bg-surface-muted sm:h-16 sm:rounded-[22px]" />
          ))}
        </div>
      ) : errorMessage ? (
        <div className="mt-4 rounded-[18px] bg-surface-muted px-4 py-4 text-sm leading-relaxed text-text-muted sm:mt-5 sm:rounded-[22px] sm:py-5">
          {errorMessage}
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-4 rounded-[18px] bg-surface-muted px-4 py-4 text-sm leading-relaxed text-text-muted sm:mt-5 sm:rounded-[22px] sm:py-5">
          No readers on the leaderboard yet.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-border sm:mt-5 sm:rounded-[24px]">
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_5.5rem] gap-2 bg-surface-muted px-3 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-subtle sm:grid-cols-[5rem_minmax(0,1fr)_9rem] sm:gap-3 sm:px-4 sm:text-xs sm:tracking-[0.16em]">
            <span>Rank</span>
            <span>Nickname</span>
            <span className="text-right">
              <span className="sm:hidden">Streak</span>
              <span className="hidden sm:inline">Current Streak</span>
            </span>
          </div>
          <div className="divide-y divide-border">
            {entries.map((entry) => {
              const isTopRank = entry.rank <= 3;
              const rowClassName = isTopRank ? 'bg-surface' : 'bg-surface-alt';
              const rankClassName = entry.rank === 1
                ? 'bg-brand text-text-on-brand'
                : isTopRank
                  ? 'bg-surface text-accent-strong'
                  : 'bg-surface-muted text-text-muted';
              const streakClassName = entry.currentStreak >= 7 || isTopRank
                ? 'bg-brand-soft text-brand-strong'
                : 'bg-surface-muted text-text-muted';

              return (
                <article
                  key={`${entry.rank}-${entry.userId}`}
                  className={`grid grid-cols-[2.75rem_minmax(0,1fr)_5.5rem] items-center gap-2 px-3 py-3 sm:grid-cols-[5rem_minmax(0,1fr)_9rem] sm:gap-3 sm:px-4 sm:py-4 ${rowClassName}`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums sm:h-9 sm:w-9 ${rankClassName}`}
                  >
                    {entry.rank}
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold text-text">
                    {entry.nickname}
                  </span>
                  <span className="text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-semibold tabular-nums sm:px-3 sm:text-sm ${streakClassName}`}>
                      {formatStreakDays(entry.currentStreak)}
                    </span>
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Profile() {
  const { logout, setProfile: setAuthProfile, username } = useAuth();
  const [profile, setProfile] = useState<ProfileReadResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<AchievementResponseDTO[]>([]);
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);
  const [portraits, setPortraits] = useState<PortraitResponseDTO[]>([]);
  const [isPortraitsLoading, setIsPortraitsLoading] = useState(true);
  const [portraitsError, setPortraitsError] = useState<string | null>(null);
  const [isPortraitModalOpen, setIsPortraitModalOpen] = useState(false);
  const [selectingPortraitCode, setSelectingPortraitCode] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [activeReadingSeriesRange, setActiveReadingSeriesRange] = useState<ProfileReadingSeriesRange>(DEFAULT_READING_SERIES_RANGE);
  const [readingSeriesByRange, setReadingSeriesByRange] = useState<ReadingSeriesCache>({});
  const [loadingReadingSeriesRange, setLoadingReadingSeriesRange] = useState<ProfileReadingSeriesRange | null>(DEFAULT_READING_SERIES_RANGE);
  const [readingSeriesErrorsByRange, setReadingSeriesErrorsByRange] = useState<ReadingSeriesErrors>({});
  const isProfileDesktop = useIsProfileDesktop();
  const activeProfileTab = isProfileDesktop && activeTab === 'stats' ? 'overview' : activeTab;

  const loadReadingSeries = async (range: ProfileReadingSeriesRange) => {
    setLoadingReadingSeriesRange(range);
    setReadingSeriesErrorsByRange((current) => ({
      ...current,
      [range]: null,
    }));

    try {
      const nextSeries = await getProfileReadingSeries(range);

      setReadingSeriesByRange((current) => ({
        ...current,
        [range]: nextSeries,
      }));
    } catch (error) {
      console.error('Error loading reading series:', error);
      setReadingSeriesErrorsByRange((current) => ({
        ...current,
        [range]: 'Could not load your reading trend right now.',
      }));
    } finally {
      setLoadingReadingSeriesRange((current) => (current === range ? null : current));
    }
  };

  useEffect(() => {
    if (!isProfileDesktop) {
      return;
    }

    setActiveTab((current) => (current === 'stats' ? 'overview' : current));
  }, [isProfileDesktop]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setIsAchievementsLoading(true);
      setAchievementsError(null);
      setIsPortraitsLoading(true);
      setPortraitsError(null);
      setLoadingReadingSeriesRange(DEFAULT_READING_SERIES_RANGE);
      setReadingSeriesErrorsByRange({});

      const profilePromise = getProfile();
      const readingSeriesPromise = getProfileReadingSeries(DEFAULT_READING_SERIES_RANGE);
      const achievementsPromise = getMyAchievements();
      const portraitsPromise = getMyPortraits();

      void readingSeriesPromise
        .then((nextSeries) => {
          if (!isMounted) {
            return;
          }

          setReadingSeriesByRange((current) => ({
            ...current,
            [DEFAULT_READING_SERIES_RANGE]: nextSeries,
          }));
        })
        .catch((error) => {
          console.error('Error loading reading series:', error);

          if (isMounted) {
            setReadingSeriesErrorsByRange((current) => ({
              ...current,
              [DEFAULT_READING_SERIES_RANGE]: 'Could not load your reading trend right now.',
            }));
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoadingReadingSeriesRange((current) => (
              current === DEFAULT_READING_SERIES_RANGE ? null : current
            ));
          }
        });

      void achievementsPromise
        .then((nextAchievements) => {
          if (!isMounted) {
            return;
          }

          setAchievements(nextAchievements);
        })
        .catch((error) => {
          console.error('Error loading achievements:', error);

          if (isMounted) {
            setAchievements([]);
            setAchievementsError('Could not load your achievements right now.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsAchievementsLoading(false);
          }
        });

      void portraitsPromise
        .then((nextPortraits) => {
          if (!isMounted) {
            return;
          }

          setPortraits(nextPortraits);
        })
        .catch((error) => {
          console.error('Error loading portraits:', error);

          if (isMounted) {
            setPortraits([]);
            setPortraitsError('Could not load your portraits right now.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsPortraitsLoading(false);
          }
        });

      try {
        const data = await profilePromise;

        if (isMounted) {
          setProfile(data);
          setNicknameDraft(data.nickname ?? '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);

        if (isMounted) {
          setErrorMessage('Could not load your profile right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeReadingSeries = readingSeriesByRange[activeReadingSeriesRange] ?? null;
  const activeReadingSeriesError = readingSeriesErrorsByRange[activeReadingSeriesRange] ?? null;
  const isActiveReadingSeriesLoading = loadingReadingSeriesRange === activeReadingSeriesRange;
  const readingChartData = useMemo(() => {
    if (!activeReadingSeries) {
      return [];
    }

    let cumulativePagesRead = 0;
    const { bucketType } = activeReadingSeries;

    return activeReadingSeries.points.map((point) => {
      cumulativePagesRead += point.pagesRead;

      return {
        date: point.date,
        label: formatReadingSeriesDate(point.date, bucketType),
        pagesRead: point.pagesRead,
        cumulativePagesRead,
      };
    });
  }, [activeReadingSeries]);
  const activeReadingSeriesPagesRead = activeReadingSeries
    ? (readingChartData.at(-1)?.cumulativePagesRead ?? 0)
    : null;

  const handleReadingSeriesRangeChange = (nextRange: ProfileReadingSeriesRange) => {
    setActiveReadingSeriesRange(nextRange);

    if (readingSeriesByRange[nextRange] || loadingReadingSeriesRange === nextRange) {
      return;
    }

    void loadReadingSeries(nextRange);
  };

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen overflow-x-hidden pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-text-muted">
          Loading your profile...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="page-bg min-h-screen overflow-x-hidden pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-lg text-danger">{errorMessage ?? 'Profile not found.'}</p>
          <p className="mt-2 text-sm text-text-muted">Check backend connection and try again.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { stats, streak, recentDailyActivities, createdAt, status, wallet } = profile;
  const { level, xpIntoLevel, xpPerLevel, maxLevel } = stats;
  const isAtMaxLevel = level >= maxLevel;
  const progressPercent = isAtMaxLevel
    ? 100
    : Math.max(0, Math.min(100, (xpIntoLevel / Math.max(1, xpPerLevel)) * 100));
  const showNewUserState = isNewUserProfile(stats);
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const lastFreezeProtection = streak?.freezeProtectedThroughDate
    ? formatActivityDate(streak.freezeProtectedThroughDate)
    : null;
  const trimmedNickname = nicknameDraft.trim();
  const isNicknameUnchanged = trimmedNickname === (profile.nickname ?? '').trim();
  const canSaveNickname = NICKNAME_PATTERN.test(trimmedNickname) && !isNicknameUnchanged;
  const nicknameHintId = 'profile-nickname-hint';
  const nicknameErrorId = 'profile-nickname-error';
  const hasNicknameFormatError = nicknameDraft.length > 0 && !NICKNAME_PATTERN.test(trimmedNickname);
  const nicknameDescriptionId = nicknameError
    ? nicknameErrorId
    : hasNicknameFormatError
      ? nicknameHintId
      : undefined;
  const selectedPortrait = profile.selectedPortrait ?? portraits.find((portrait) => portrait.selected) ?? null;
  const portraitCollection = selectedPortrait
    ? portraits.map((portrait) => ({
      ...portrait,
      selected: portrait.code === selectedPortrait.code,
    }))
    : portraits;

  const handleNicknameSave = async () => {
    if (!canSaveNickname || isSavingNickname) {
      return;
    }

    try {
      setIsSavingNickname(true);
      setNicknameError(null);
      const updatedProfile = await updateNickname(trimmedNickname);
      setProfile(updatedProfile);
      setAuthProfile(updatedProfile);
      setNicknameDraft(updatedProfile.nickname ?? '');
      toast.success('Nickname updated.');
    } catch (error) {
      if (error instanceof ApiValidationError) {
        setNicknameError(error.fieldErrors.nickname ?? error.message);
      } else {
        setNicknameError('Could not update your nickname right now.');
      }
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleSelectPortrait = async (portrait: PortraitResponseDTO) => {
    if (!portrait.unlocked || portrait.selected || selectingPortraitCode != null) {
      return;
    }

    try {
      setSelectingPortraitCode(portrait.code);
      const updatedPortrait = {
        ...(await selectPortrait(portrait.code)),
        unlocked: true,
        selected: true,
      };
      const nextPortraits = portraits.map((item) => {
        if (item.code === updatedPortrait.code) {
          return updatedPortrait;
        }

        return {
          ...item,
          selected: false,
        };
      });
      const hasUpdatedPortrait = nextPortraits.some((item) => item.code === updatedPortrait.code);
      const finalPortraits = hasUpdatedPortrait ? nextPortraits : [...nextPortraits, updatedPortrait];
      const nextProfile = {
        ...profile,
        selectedPortrait: updatedPortrait,
      };

      setPortraits(finalPortraits);
      setProfile(nextProfile);
      setAuthProfile(nextProfile);
      toast.success(`${updatedPortrait.name} is now your portrait.`);
    } catch (error) {
      if (error instanceof ApiResponseError && error.status === 400) {
        toast.error('That portrait is still locked.');
      } else {
        toast.error('Could not update your portrait right now.');
      }
    } finally {
      setSelectingPortraitCode(null);
    }
  };

  const unlockedAchievementsCount = achievements.filter((achievement) => achievement.unlocked).length;
  const totalAchievementsCount = achievements.length;
  const displayedReadingPagesRead = activeReadingSeriesPagesRead ?? stats.totalPagesRead;

  const statCards = [
    {
      label: 'Current Streak',
      value: formatStreakDays(currentStreak),
      icon: Flame,
      tone: 'brand' as const,
    },
    {
      label: 'Longest Streak',
      value: formatStreakDays(longestStreak),
      icon: Trophy,
      tone: 'accent' as const,
    },
    {
      label: 'Books Read',
      value: stats.totalBooksRead,
      icon: BookOpen,
      tone: 'brand' as const,
    },
    {
      label: 'Time Read',
      value: formatReadingTime(stats.totalMinutesRead),
      icon: Clock3,
      tone: 'brand' as const,
    },
    {
      label: 'Sessions',
      value: stats.totalSessionsCompleted,
      icon: Zap,
      tone: 'brand' as const,
    },
  ];

  const statsSections = (
    <>
      <section className="mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.slice(0, 3).map((card, index) => (
          <ProfileStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            delayMs={index * 80}
          />
        ))}
        <ReadingPagesChartCard
          activeRange={activeReadingSeriesRange}
          chartData={readingChartData}
          errorMessage={activeReadingSeriesError}
          isLoading={isActiveReadingSeriesLoading}
          series={activeReadingSeries}
          totalPagesRead={displayedReadingPagesRead}
          onRangeChange={handleReadingSeriesRangeChange}
          onRetry={() => void loadReadingSeries(activeReadingSeriesRange)}
        />
        <div className="hidden min-h-0 lg:grid lg:h-full lg:grid-rows-2 lg:gap-4">
          {statCards.slice(3).map((card, index) => (
            <ProfileStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              delayMs={(index + 4) * 80}
              className="h-full min-h-0"
              isCompact
            />
          ))}
        </div>
        <div className="contents lg:hidden">
          {statCards.slice(3).map((card, index) => (
            <ProfileStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              delayMs={(index + 4) * 80}
            />
          ))}
        </div>
      </section>

      {lastFreezeProtection ? (
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailCard
            title="Last Freeze Protection"
            value={lastFreezeProtection}
            description="The most recent missed reading day a freeze protected automatically."
          />
        </section>
      ) : null}

      <div className="mt-6">
        <RecentActivitySection activities={recentDailyActivities} />
      </div>
    </>
  );

  return (
    <div className="page-bg min-h-screen overflow-x-hidden pb-28 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 sm:mb-6">
          <div>
            <h1 className="text-4xl font-semibold text-text">Profile</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              Track your reading level, streaks, and milestones in one place.
            </p>
            {username ? (
              <p className="mt-2 text-sm text-text-subtle">Signed in as {username}</p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <Link
              to="/store#themes"
              className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-[0_10px_22px_rgba(31,41,55,0.05)] transition-colors hover:bg-surface-alt sm:min-w-[15rem]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface-muted text-text">
                  <Paintbrush size={18} />
                </span>
                <span className="flex flex-col items-start">
                  <span>Appearance</span>
                  <span className="text-xs font-normal text-text-muted">Choose your reading theme</span>
                </span>
              </span>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
                Store
              </span>
            </Link>
            <Button variant="outline" className="rounded-full px-5" onClick={() => void logout()}>
              <span className="inline-flex items-center gap-2">
                <LogOut size={16} />
                Log out
              </span>
            </Button>
          </div>
        </div>

        <div className="flex justify-start">
          <ProfileTabs
            active={activeProfileTab}
            unlockedCount={unlockedAchievementsCount}
            totalCount={totalAchievementsCount}
            onChange={setActiveTab}
          />
        </div>

        {activeProfileTab === 'overview' ? (
          <>
            <section className="mt-6 rounded-[32px] border border-border bg-surface px-6 py-7 shadow-[0_18px_36px_rgba(31,41,55,0.07)] sm:px-8">
              <div className="grid gap-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                <div className="mx-auto w-36 md:mx-0 md:w-40">
                  <PortraitImage
                    assetKey={selectedPortrait?.assetKey}
                    name={selectedPortrait?.name ?? undefined}
                    className="shadow-[0_18px_36px_rgba(31,41,55,0.16)] ring-4 ring-surface-muted"
                  />
                </div>

                <div className="min-w-0 text-center md:text-left">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Selected portrait</p>
                      <h2 className="mt-2 text-3xl font-semibold text-text">
                        {selectedPortrait?.name ?? `Level ${level}`}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-text-muted">
                        {selectedPortrait?.description ?? 'Your mascot portrait will appear here once the collection loads.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full px-5"
                      onClick={() => setIsPortraitModalOpen(true)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Images size={16} />
                        Portrait collection
                      </span>
                    </Button>
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted md:justify-start">
                      <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong">
                        Level {level}{isAtMaxLevel ? ' — MAX' : ''}
                      </span>
                      <span className="rounded-full bg-surface-muted px-3 py-1.5">{stats.totalXpEarned} total XP</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted md:justify-start">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 font-medium text-accent-strong">
                        <Coins size={15} aria-hidden="true" />
                        {wallet.coinBalance} coins
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5">
                        <Snowflake size={15} className="text-brand-strong" aria-hidden="true" />
                        Streak freezes owned: {wallet.availableStreakFreezes}
                      </span>
                    </div>
                    <div className="mt-4 h-3.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${isAtMaxLevel ? 100 : Math.max(progressPercent, 6)}%` }}
                      />
                    </div>
                    {isAtMaxLevel ? (
                      <p className="mt-2 text-xs text-text-muted">Max level reached</p>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">{xpIntoLevel}/{xpPerLevel} XP — {stats.xpToNextLevel} to next level</p>
                    )}
                  </div>

                  <DailyQuestCard className="mt-5 shadow-none" />

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted md:justify-start">
                    <span className="rounded-full bg-surface-muted px-3 py-1.5">Member since {formatMemberSince(createdAt)}</span>
                    <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong">Status: {status}</span>
                  </div>
                </div>
              </div>
            </section>

            {showNewUserState ? (
              <section className="mt-6 rounded-[28px] border border-border bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-brand-soft)_100%)] p-5 shadow-[0_14px_30px_rgba(31,41,55,0.05)]">
                <p className="text-base font-medium text-text">Your journey is just getting started</p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Finish your first reading session to begin earning XP, building streaks, and filling out your profile.
                </p>
              </section>
            ) : null}

            <section className="mt-6 rounded-[28px] border border-border bg-surface p-5 shadow-[0_14px_30px_rgba(31,41,55,0.05)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Nickname</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">How circles see you</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
                This name appears in BookCircles. Use 3-20 letters, numbers, or underscores.
              </p>
            </div>
            <span className="rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-text">
              {(profile.nickname ?? '').trim() || 'No nickname'}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label htmlFor="profile-nickname" className={fieldLabelClassName}>
                Nickname
              </label>
              <input
                id="profile-nickname"
                name="nickname"
                type="text"
                value={nicknameDraft}
                onChange={(event) => {
                  setNicknameDraft(event.target.value);
                  setNicknameError(null);
                }}
                className={inputClassName}
                maxLength={20}
                autoComplete="nickname"
                spellCheck={false}
                inputMode="text"
                aria-invalid={nicknameError ? 'true' : 'false'}
                aria-describedby={nicknameDescriptionId}
              />
              {nicknameError ? (
                <p id={nicknameErrorId} className={fieldErrorClassName}>{nicknameError}</p>
              ) : hasNicknameFormatError ? (
                <p id={nicknameHintId} className={fieldHintClassName}>
                  3-20 characters, letters, digits, or underscore.
                </p>
              ) : null}
            </div>

            <Button
              type="button"
              className="rounded-full px-5 sm:self-end"
              disabled={!canSaveNickname || isSavingNickname}
              onClick={() => void handleNicknameSave()}
            >
              {isSavingNickname ? 'Saving...' : 'Save nickname'}
            </Button>
          </div>
        </section>

            <div className="hidden sm:block">
              {statsSections}
            </div>
          </>
        ) : activeProfileTab === 'stats' ? (
          <div className="sm:hidden">
            {statsSections}
          </div>
        ) : activeProfileTab === 'leaderboard' ? (
          <StreakLeaderboardSection />
        ) : (
          <AchievementsSection
            achievements={achievements}
            isLoading={isAchievementsLoading}
            errorMessage={achievementsError}
          />
        )}
      </div>

      <PortraitCollectionModal
        isOpen={isPortraitModalOpen}
        portraits={portraitCollection}
        isLoading={isPortraitsLoading}
        errorMessage={portraitsError}
        selectingPortraitCode={selectingPortraitCode}
        onClose={() => setIsPortraitModalOpen(false)}
        onSelectPortrait={(portrait) => void handleSelectPortrait(portrait)}
      />
      <BottomNav />
    </div>
  );
}
