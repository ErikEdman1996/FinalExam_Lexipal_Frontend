import { useEffect, useState, type ComponentType } from 'react';
import { BookOpen, Brain, Flame, LogOut, Target, Trophy, Zap } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { useAuth } from '../features/auth/AuthProvider';
import {
  getProfile,
  type DailyActivityReadResponseDTO,
  type ProfileReadResponseDTO,
  type ProfileStatsResponseDTO,
} from '../api/api';

const XP_PER_LEVEL = 100;

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

const getLevelMeta = (totalXp: number) => {
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  const progressPercent = (xpIntoLevel / XP_PER_LEVEL) * 100;

  return {
    level,
    xpIntoLevel,
    progressPercent,
  };
};

interface ProfileStatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  iconWrapClassName: string;
  iconClassName: string;
  delayMs: number;
}

function ProfileStatCard({
  label,
  value,
  icon: Icon,
  iconWrapClassName,
  iconClassName,
  delayMs,
}: ProfileStatCardProps) {
  return (
    <div
      className="rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-white/90 p-5 shadow-[0_14px_30px_rgba(31,41,55,0.06)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${iconWrapClassName}`}>
        <Icon size={22} className={iconClassName} />
      </div>
      <p className="mt-5 text-[2rem] font-semibold leading-none text-[#22324A]">{value}</p>
      <p className="mt-2 text-sm text-[#6A7687]">{label}</p>
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
    <div className="rounded-[26px] border border-[rgba(36,52,71,0.08)] bg-white/88 p-5 shadow-[0_12px_26px_rgba(31,41,55,0.05)]">
      <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">{title}</p>
      <p className="mt-3 text-lg font-semibold text-[#22324A]">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">{description}</p>
    </div>
  );
}

interface RecentActivitySectionProps {
  activities: DailyActivityReadResponseDTO[];
}

function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  return (
    <section className="rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/90 p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8A94A6]">Recent Activity</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#22324A]">Latest milestones</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#FDECD9]">
          <Zap size={20} className="text-[#DD8A3D]" />
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="mt-5 rounded-[22px] bg-[#F7F9FC] px-4 py-5 text-sm leading-relaxed text-[#6A7687]">
          Your recent sessions and XP moments will appear here once you start reading.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {activities.slice(0, 4).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between gap-4 rounded-[22px] bg-[#F7F9FC] px-4 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#22324A]">{toReadableActivityLabel(activity.activityType)}</p>
                <p className="mt-1 text-sm text-[#6A7687]">
                  {formatActivityDate(activity.activityDate)}
                  {activity.sessionId != null ? ` • Session #${activity.sessionId}` : ''}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#E8F7EF] px-3 py-1 text-sm font-medium text-[#2F7D5F]">
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
  const { logout, username } = useAuth();
  const [profile, setProfile] = useState<ProfileReadResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getProfile();

        if (isMounted) {
          setProfile(data);
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
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F8F5FF_100%)] pb-24">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-[#6A7687]">
          Loading your profile...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F8F5FF_100%)] pb-24">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-lg text-[#FF6B6B]">{errorMessage ?? 'Profile not found.'}</p>
          <p className="mt-2 text-sm text-[#6A7687]">Check backend connection and try again.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { stats, streak, recentDailyActivities, createdAt, status } = profile;
  const { level, xpIntoLevel, progressPercent } = getLevelMeta(stats.totalXpEarned);
  const showNewUserState = isNewUserProfile(stats);
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const lastActive = streak?.lastActivityDate ? formatActivityDate(streak.lastActivityDate) : 'No activity yet';

  const statCards = [
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Flame,
      iconWrapClassName: 'bg-[#FFE6D5]',
      iconClassName: 'text-[#F27847]',
    },
    {
      label: 'Longest Streak',
      value: `${longestStreak} days`,
      icon: Trophy,
      iconWrapClassName: 'bg-[#FFF1BF]',
      iconClassName: 'text-[#D8A100]',
    },
    {
      label: 'Books Read',
      value: stats.totalBooksRead,
      icon: BookOpen,
      iconWrapClassName: 'bg-[#DFF5EA]',
      iconClassName: 'text-[#3D9B7A]',
    },
    {
      label: 'Pages Read',
      value: stats.totalPagesRead,
      icon: Target,
      iconWrapClassName: 'bg-[#DCEFFF]',
      iconClassName: 'text-[#4B93D1]',
    },
    {
      label: 'Words Captured',
      value: stats.totalCapturedWords,
      icon: Brain,
      iconWrapClassName: 'bg-[#EDE0FF]',
      iconClassName: 'text-[#8A61D7]',
    },
    {
      label: 'Sessions',
      value: stats.totalSessionsCompleted,
      icon: Zap,
      iconWrapClassName: 'bg-[#FFDDEA]',
      iconClassName: 'text-[#D85B9C]',
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_52%,#F8F4FF_100%)] pb-24">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[#22324A]">Profile</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6A7687]">
              Track your reading level, streaks, and milestones in one place.
            </p>
            {username ? (
              <p className="mt-2 text-sm text-[#8A94A6]">Signed in as {username}</p>
            ) : null}
          </div>
          <Button variant="outline" className="rounded-full px-5" onClick={() => void logout()}>
            <span className="inline-flex items-center gap-2">
              <LogOut size={16} />
              Log out
            </span>
          </Button>
        </div>

        <section className="rounded-[32px] border border-[rgba(36,52,71,0.08)] bg-white/92 px-6 py-7 text-center shadow-[0_18px_36px_rgba(31,41,55,0.07)] sm:px-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#DDF7EE_0%,#C8EFE1_55%,#BDE8D8_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <span className="text-4xl font-semibold text-[#3E9D7B]">{level}</span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-[#22324A]">Level {level}</h2>
          <p className="mt-2 text-sm text-[#6A7687]">{stats.totalXpEarned} total XP</p>

          <div className="mt-5">
            <div className="h-3.5 overflow-hidden rounded-full bg-[#F7D8BE]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#FFC79C_0%,#F7B58A_40%,#F4C1A5_100%)] transition-[width] duration-500"
                style={{ width: `${Math.max(progressPercent, 6)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[#6A7687]">{xpIntoLevel}/{XP_PER_LEVEL} XP to next level</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-[#6A7687]">
            <span className="rounded-full bg-[#F5F7FB] px-3 py-1.5">Member since {formatMemberSince(createdAt)}</span>
            <span className="rounded-full bg-[#EAF7F1] px-3 py-1.5 text-[#2F7D5F]">Status: {status}</span>
          </div>
        </section>

        {showNewUserState ? (
          <section className="mt-6 rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-[linear-gradient(135deg,#FFF6EA_0%,#F0FBF6_100%)] p-5 shadow-[0_14px_30px_rgba(31,41,55,0.05)]">
            <p className="text-base font-medium text-[#22324A]">Your journey is just getting started</p>
            <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">
              Finish your first reading session to begin earning XP, building streaks, and filling out your profile.
            </p>
          </section>
        ) : null}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {statCards.map((card, index) => (
            <ProfileStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconWrapClassName={card.iconWrapClassName}
              iconClassName={card.iconClassName}
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
