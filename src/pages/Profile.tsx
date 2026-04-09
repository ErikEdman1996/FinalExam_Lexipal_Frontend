import { useEffect, useState, type ComponentType } from 'react';
import { BookMarked, CalendarDays, Flame, Sparkles, Target, TrendingUp } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import {
  getProfile,
  type DailyActivityReadResponseDTO,
  type ProfileReadResponseDTO,
  type ProfileStatsResponseDTO,
  type StreakMetaDataReadResponseDTO,
} from '../api/api';

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
    weekday: 'short',
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
  value: number;
  accentClassName: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

function ProfileStatCard({ label, value, accentClassName, icon: Icon }: ProfileStatCardProps) {
  return (
    <div className={`rounded-[26px] border p-5 bg-gradient-to-br shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${accentClassName}`}>
      <div className="w-11 h-11 rounded-[16px] bg-white/75 flex items-center justify-center">
        <Icon size={20} className="text-[#2C3E50]" />
      </div>
      <p className="text-sm text-[#52606D] mt-4">{label}</p>
      <p className="text-3xl font-semibold text-[#2C3E50] mt-1">{value}</p>
    </div>
  );
}

interface StreakCardProps {
  streak: StreakMetaDataReadResponseDTO | null;
}

function StreakCard({ streak }: StreakCardProps) {
  const hasStreakData = streak && (streak.currentStreak > 0 || streak.longestStreak > 0 || !!streak.lastActivityDate);

  return (
    <section className="rounded-[32px] bg-gradient-to-br from-[#FFF4EA] via-[#FFE9D7] to-[#FFE1C8] border border-[rgba(255,176,109,0.22)] p-6 shadow-[0_14px_32px_rgba(180,92,30,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#A1632A]">Streak</p>
          <h2 className="text-2xl font-semibold text-[#2C3E50] mt-2">Keep your reading fire alive</h2>
        </div>
        <div className="w-14 h-14 rounded-[20px] bg-white/70 flex items-center justify-center shrink-0">
          <Flame size={24} className="text-[#C7661F]" />
        </div>
      </div>

      {hasStreakData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-[22px] bg-white/72 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1632A]">Current</p>
              <p className="text-3xl font-semibold text-[#2C3E50] mt-2">{streak?.currentStreak ?? 0}</p>
              <p className="text-sm text-[#6C757D] mt-1">day streak</p>
            </div>
            <div className="rounded-[22px] bg-white/72 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1632A]">Longest</p>
              <p className="text-3xl font-semibold text-[#2C3E50] mt-2">{streak?.longestStreak ?? 0}</p>
              <p className="text-sm text-[#6C757D] mt-1">best run</p>
            </div>
            <div className="rounded-[22px] bg-white/72 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#A1632A]">Last Active</p>
              <p className="text-lg font-semibold text-[#2C3E50] mt-2">
                {streak?.lastActivityDate ? formatActivityDate(streak.lastActivityDate) : 'No activity yet'}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-[24px] bg-white/72 p-5 mt-6">
          <p className="text-[#2C3E50] font-medium">No streak yet</p>
          <p className="text-sm text-[#6C757D] mt-2 leading-relaxed">
            Complete reading sessions on consecutive days to start building your streak.
          </p>
        </div>
      )}
    </section>
  );
}

interface RecentActivitySectionProps {
  activities: DailyActivityReadResponseDTO[];
}

function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  return (
    <section className="rounded-[32px] bg-white border border-[rgba(0,0,0,0.05)] p-6 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#7B8794]">Recent Activity</p>
          <h2 className="text-2xl font-semibold text-[#2C3E50] mt-2">Your latest reading milestones</h2>
        </div>
        <div className="w-12 h-12 rounded-[18px] bg-[#EEF7F3] flex items-center justify-center shrink-0">
          <TrendingUp size={20} className="text-[#2D725B]" />
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-[24px] bg-[#F8F9FA] p-5 mt-6">
          <p className="text-[#2C3E50] font-medium">No recent activity yet</p>
          <p className="text-sm text-[#6C757D] mt-2 leading-relaxed">
            Once you complete sessions and earn XP, your latest activity will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-11 h-11 rounded-[16px] bg-[#FFF2E6] flex items-center justify-center">
                  <Sparkles size={18} className="text-[#B35C1E]" />
                </div>
                {index !== activities.length - 1 ? (
                  <div className="w-px flex-1 bg-[linear-gradient(to_bottom,rgba(179,92,30,0.24),rgba(45,114,91,0.14))] mt-2" />
                ) : null}
              </div>

              <div className="flex-1 rounded-[24px] bg-[#FCFCFD] border border-[rgba(0,0,0,0.04)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#2C3E50]">
                    {toReadableActivityLabel(activity.activityType)}
                  </p>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#EAF7F1] text-[#2D725B] font-medium">
                    +{activity.xpEarned} XP
                  </span>
                </div>
                <p className="text-sm text-[#6C757D] mt-2">{formatActivityDate(activity.activityDate)}</p>
                {activity.sessionId != null ? (
                  <p className="text-sm text-[#52606D] mt-2">Session #{activity.sessionId}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Profile() {
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
      <div className="min-h-screen bg-[#F7F8F5] pb-20">
        <div className="max-w-[1120px] mx-auto px-6 py-16 text-center text-[#6C757D]">
          Loading your profile...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] pb-20">
        <div className="max-w-[1120px] mx-auto px-6 py-16 text-center">
          <p className="text-[#FF6B6B] text-lg">{errorMessage ?? 'Profile not found.'}</p>
          <p className="text-sm text-[#6C757D] mt-2">Check backend connection and try again.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { stats, streak, recentDailyActivities, createdAt, status } = profile;
  const showNewUserState = isNewUserProfile(stats);

  return (
    <div className="min-h-screen bg-[#F7F8F5] pb-20">
      <div className="bg-[radial-gradient(circle_at_top_left,#FFF2E6_0%,#F7F8F5_48%,#EEF6F2_100%)] border-b border-[rgba(0,0,0,0.06)]">
        <div className="max-w-[1120px] mx-auto px-6 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
            <section className="rounded-[34px] bg-white/82 backdrop-blur-sm border border-[rgba(255,255,255,0.7)] p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#7B8794]">Your Profile</p>
                  <h1 className="text-4xl sm:text-5xl font-semibold text-[#2C3E50] mt-3 leading-none">
                    Reading in motion
                  </h1>
                  <p className="text-sm sm:text-base text-[#52606D] mt-4 max-w-xl leading-relaxed">
                    Track how your library habits, saved words, and streaks are growing over time.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#FFF3E7] to-[#DFF2E8] flex items-center justify-center shrink-0">
                  <BookMarked size={28} className="text-[#2C3E50]" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F9FA] px-4 py-2 text-sm text-[#52606D]">
                  <CalendarDays size={16} />
                  <span>Member since {formatMemberSince(createdAt)}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF6F2] px-4 py-2 text-sm text-[#2D725B]">
                  <Target size={16} />
                  <span>Status: {status}</span>
                </div>
              </div>

              {showNewUserState ? (
                <div className="rounded-[26px] bg-gradient-to-r from-[#FFF4EA] to-[#EDF8F2] border border-[rgba(0,0,0,0.05)] p-5 mt-6">
                  <p className="text-[#2C3E50] font-medium">Your journey is just getting started</p>
                  <p className="text-sm text-[#6C757D] mt-2 leading-relaxed">
                    Finish your first reading session to start filling out your profile with pages, XP, activity, and streak progress.
                  </p>
                </div>
              ) : null}
            </section>

            <StreakCard streak={streak} />
          </div>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto px-6 py-8 space-y-8">
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#7B8794]">Stats</p>
              <h2 className="text-2xl font-semibold text-[#2C3E50] mt-2">A snapshot of your progress</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <ProfileStatCard
              label="Pages Read"
              value={stats.totalPagesRead}
              icon={BookMarked}
              accentClassName="from-[#FFF8EE] to-[#FFE7D1] border-[rgba(255,186,122,0.24)]"
            />
            <ProfileStatCard
              label="Books Completed"
              value={stats.totalBooksRead}
              icon={Target}
              accentClassName="from-[#EFFAF5] to-[#DDF4EC] border-[rgba(61,163,122,0.22)]"
            />
            <ProfileStatCard
              label="Sessions Completed"
              value={stats.totalSessionsCompleted}
              icon={CalendarDays}
              accentClassName="from-[#F8F5FF] to-[#EEE6FF] border-[rgba(117,81,196,0.14)]"
            />
            <ProfileStatCard
              label="Saved Words"
              value={stats.totalCapturedWords}
              icon={Sparkles}
              accentClassName="from-[#FFF6EB] to-[#FFEBD6] border-[rgba(179,92,30,0.16)]"
            />
            <ProfileStatCard
              label="Total XP"
              value={stats.totalXpEarned}
              icon={TrendingUp}
              accentClassName="from-[#EEF8F4] to-[#DFF2E8] border-[rgba(45,114,91,0.18)]"
            />
          </div>
        </section>

        <RecentActivitySection activities={recentDailyActivities} />
      </div>

      <BottomNav />
    </div>
  );
}
