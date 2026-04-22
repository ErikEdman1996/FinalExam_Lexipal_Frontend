import { useEffect, useState, type ComponentType } from 'react';
import { BookOpen, Brain, Clock3, Flame, LogOut, Target, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { ThemeToggle } from '../features/theme/ThemeToggle.tsx';
import { useAuth } from '../features/auth/AuthProvider';
import { getXpProgressMeta, XP_PER_LEVEL } from '../features/xp/xp';
import {
  ApiValidationError,
  getProfile,
  updateNickname,
  type DailyActivityReadResponseDTO,
  type ProfileReadResponseDTO,
  type ProfileStatsResponseDTO,
} from '../api/api';

const NICKNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

const formatMemberSince = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatActivityDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value || 'Unknown date';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const toReadableActivityLabel = (activityType: string) => {
  return activityType
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const isNewUserProfile = (stats: ProfileStatsResponseDTO) => {
  return (
    stats.totalPagesRead === 0
    && stats.totalBooksRead === 0
    && stats.totalSessionsCompleted === 0
    && stats.totalCapturedWords === 0
    && stats.totalXpEarned === 0
  );
};

interface ProfileStatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: 'brand' | 'accent';
  delayMs: number;
}

function ProfileStatCard({
  label,
  value,
  icon: Icon,
  tone,
  delayMs,
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

  return (
    <div
      className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_14px_30px_rgba(31,41,55,0.06)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${toneClasses.chip}`}>
        <Icon size={22} className={toneClasses.icon} />
      </div>
      <p className="mt-5 text-[2rem] font-semibold leading-none text-text">{value}</p>
      <p className="mt-2 text-sm text-text-muted">{label}</p>
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
                  {activity.sessionId != null ? ` - Session #${activity.sessionId}` : ''}
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

export default function Profile() {
  const { logout, setProfile: setAuthProfile, username } = useAuth();
  const [profile, setProfile] = useState<ProfileReadResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getProfile();

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

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-text-muted">
          Loading your profile...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-lg text-danger">{errorMessage ?? 'Profile not found.'}</p>
          <p className="mt-2 text-sm text-text-muted">Check backend connection and try again.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { stats, streak, recentDailyActivities, createdAt, status } = profile;
  const { level, xpIntoLevel, progressPercent } = getXpProgressMeta(stats.totalXpEarned);
  const showNewUserState = isNewUserProfile(stats);
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const lastActive = streak?.lastActivityDate ? formatActivityDate(streak.lastActivityDate) : 'No activity yet';
  const trimmedNickname = nicknameDraft.trim();
  const isNicknameUnchanged = trimmedNickname === (profile.nickname ?? '').trim();
  const canSaveNickname = NICKNAME_PATTERN.test(trimmedNickname) && !isNicknameUnchanged;

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

  const statCards = [
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Flame,
      tone: 'brand' as const,
    },
    {
      label: 'Longest Streak',
      value: `${longestStreak} days`,
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
      label: 'Pages Read',
      value: stats.totalPagesRead,
      icon: Target,
      tone: 'accent' as const,
    },
    {
      label: 'Minutes Read',
      value: stats.totalMinutesRead,
      icon: Clock3,
      tone: 'brand' as const,
    },
    {
      label: 'Words Captured',
      value: stats.totalCapturedWords,
      icon: Brain,
      tone: 'accent' as const,
    },
    {
      label: 'Sessions',
      value: stats.totalSessionsCompleted,
      icon: Zap,
      tone: 'brand' as const,
    },
  ];

  return (
    <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-text">Profile</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              Track your reading level, streaks, and milestones in one place.
            </p>
            {username ? (
              <p className="mt-2 text-sm text-text-subtle">Signed in as {username}</p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <ThemeToggle variant="row" className="sm:min-w-[15rem]" />
            <Button variant="outline" className="rounded-full px-5" onClick={() => void logout()}>
              <span className="inline-flex items-center gap-2">
                <LogOut size={16} />
                Log out
              </span>
            </Button>
          </div>
        </div>

        <section className="rounded-[32px] border border-border bg-surface px-6 py-7 text-center shadow-[0_18px_36px_rgba(31,41,55,0.07)] sm:px-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,var(--color-brand-soft)_0%,var(--color-accent-soft)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <span className="text-4xl font-semibold text-brand-strong">{level}</span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-text">Level {level}</h2>
          <p className="mt-2 text-sm text-text-muted">{stats.totalXpEarned} total XP</p>

          <div className="mt-5">
            <div className="h-3.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.max(progressPercent, 6)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">{xpIntoLevel}/{XP_PER_LEVEL} XP to next level</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
            <span className="rounded-full bg-surface-muted px-3 py-1.5">Member since {formatMemberSince(createdAt)}</span>
            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong">Status: {status}</span>
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
              <label htmlFor="profile-nickname" className="mb-2 block text-sm text-text">
                Nickname
              </label>
              <input
                id="profile-nickname"
                type="text"
                value={nicknameDraft}
                onChange={(event) => {
                  setNicknameDraft(event.target.value);
                  setNicknameError(null);
                }}
                className="w-full rounded-[16px] border border-border bg-surface-muted px-4 py-3 text-text outline-none transition-all focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand"
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
              />
              {nicknameError ? (
                <p className="mt-2 text-sm text-danger">{nicknameError}</p>
              ) : nicknameDraft.length > 0 && !NICKNAME_PATTERN.test(trimmedNickname) ? (
                <p className="mt-2 text-sm text-text-subtle">
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

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {statCards.map((card, index) => (
            <ProfileStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              delayMs={index * 80}
            />
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailCard
            title="Last Active"
            value={lastActive}
            description="Your most recent recorded reading activity."
          />
          <DetailCard
            title="Reading Momentum"
            value={currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak'}
            description="Read on consecutive days to build consistency and improve your longest run."
          />
        </section>

        <div className="mt-6">
          <RecentActivitySection activities={recentDailyActivities} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
