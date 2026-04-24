import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Images,
  LockKeyhole,
  LogOut,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
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
import { ThemeToggle } from '../features/theme/ThemeToggle.tsx';
import { useAuth } from '../features/auth/useAuth';
import { getXpProgressMeta, XP_PER_LEVEL } from '../features/xp/xp';
import { PortraitImage } from '../features/portraits/portraitAssets';
import { formatLongDate, formatMonthDay } from '../utils/formatting';
import {
  ApiResponseError,
  ApiValidationError,
  getMyAchievements,
  getMyPortraits,
  getProfile,
  selectPortrait,
  updateNickname,
  type AchievementResponseDTO,
  type DailyActivityReadResponseDTO,
  type PortraitResponseDTO,
  type ProfileReadResponseDTO,
  type ProfileStatsResponseDTO,
} from '../api/api';

const NICKNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const SEEN_ACHIEVEMENTS_STORAGE_KEY = 'lexipal.seenAchievements.v1';

type AchievementFilter = 'all' | 'unlocked' | 'locked';

const ACHIEVEMENT_FILTERS: { value: AchievementFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'locked', label: 'Locked' },
];

const formatMemberSince = (value: string) => {
  return formatLongDate(value);
};

const formatActivityDate = (value: string) => {
  return formatMonthDay(value);
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
    && stats.totalCapturedWords === 0
    && stats.totalXpEarned === 0
  );
};

const getSeenAchievementCodes = () => {
  if (typeof window === 'undefined') {
    return new Set<string>();
  }

  try {
    const rawValue = window.localStorage.getItem(SEEN_ACHIEVEMENTS_STORAGE_KEY);
    const parsed: unknown = rawValue ? JSON.parse(rawValue) : [];

    return new Set(Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

const markAchievementCodesSeen = (codes: string[]) => {
  if (typeof window === 'undefined' || codes.length === 0) {
    return;
  }

  try {
    const seenCodes = getSeenAchievementCodes();
    codes.forEach((code) => seenCodes.add(code));
    window.localStorage.setItem(SEEN_ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(Array.from(seenCodes)));
  } catch {
    // localStorage can be unavailable in private or restricted browsing contexts.
  }
};

const announceNewlyUnlockedAchievements = (achievements: AchievementResponseDTO[]) => {
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);

  if (unlockedAchievements.length === 0) {
    return;
  }

  const seenCodes = getSeenAchievementCodes();
  const newlyUnlocked = unlockedAchievements.filter((achievement) => !seenCodes.has(achievement.code));

  markAchievementCodesSeen(unlockedAchievements.map((achievement) => achievement.code));

  if (newlyUnlocked.length === 1) {
    toast.success(`Achievement unlocked: ${newlyUnlocked[0].title}`);
  } else if (newlyUnlocked.length > 1) {
    toast.success(`${newlyUnlocked.length} achievements unlocked.`);
  }
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

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setIsAchievementsLoading(true);
      setAchievementsError(null);
      setIsPortraitsLoading(true);
      setPortraitsError(null);

      const profilePromise = getProfile();
      const achievementsPromise = getMyAchievements();
      const portraitsPromise = getMyPortraits();

      void achievementsPromise
        .then((nextAchievements) => {
          if (!isMounted) {
            return;
          }

          setAchievements(nextAchievements);
          announceNewlyUnlockedAchievements(nextAchievements);
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
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">
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

        <section className="rounded-[32px] border border-border bg-surface px-6 py-7 shadow-[0_18px_36px_rgba(31,41,55,0.07)] sm:px-8">
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
                  <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong">Level {level}</span>
                  <span className="rounded-full bg-surface-muted px-3 py-1.5">{stats.totalXpEarned} total XP</span>
                </div>
                <div className="mt-4 h-3.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-500"
                    style={{ width: `${Math.max(progressPercent, 6)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">{xpIntoLevel}/{XP_PER_LEVEL} XP to next level</p>
              </div>

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

        <AchievementsSection
          achievements={achievements}
          isLoading={isAchievementsLoading}
          errorMessage={achievementsError}
        />

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
