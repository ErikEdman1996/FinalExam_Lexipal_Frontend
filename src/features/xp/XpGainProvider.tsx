import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  getProfile,
  getStreakLeaderboard,
  type AchievementResponseDTO,
  type DailyQuestResponseDTO,
  type StreakLeaderboardEntryDTO,
} from '../../api/api';
import {
  AchievementUnlockBar,
  type AchievementUnlockPresentation,
} from '../../components/AchievementUnlockBar';
import {
  CoinGainBar,
  type CoinGainPresentation,
} from '../../components/CoinGainBar';
import {
  DailyQuestRewardBar,
  type DailyQuestRewardPresentation,
} from '../../components/DailyQuestRewardBar';
import {
  LeaderboardRankChangeBar,
  type LeaderboardRankChangePresentation,
} from '../../components/LeaderboardRankChangeBar';
import { XpGainBar, type XpGainPresentation } from '../../components/XpGainBar';
import { useAuth } from '../auth/useAuth';
import { launchCelebration } from './confetti';
import {
  XpGainContext,
  type CoinGainSource,
  type RewardTrigger,
  type XpGainTrigger,
} from './XpGainContext';

type RewardQueueItem =
  | ({ type: 'xp' } & Pick<XpGainTrigger, 'xpUpdate' | 'source'>)
  | {
    type: 'coin';
    coinsAwarded: number;
    fromCoinBalance: number;
    source: CoinGainSource;
    toCoinBalance: number;
  }
  | {
    type: 'achievement';
    achievement: AchievementResponseDTO;
  }
  | {
    type: 'dailyQuest';
    dailyQuest: DailyQuestResponseDTO;
  }
  | {
    type: 'leaderboardRankCheck';
  };

type ActiveRewardPresentation =
  | {
    type: 'xp';
    item: XpGainPresentation;
  }
  | {
    type: 'coin';
    item: CoinGainPresentation;
  }
  | {
    type: 'achievement';
    item: AchievementUnlockPresentation;
  }
  | {
    type: 'dailyQuest';
    item: DailyQuestRewardPresentation;
  }
  | {
    type: 'leaderboardRankChange';
    item: LeaderboardRankChangePresentation;
  };

const LEADERBOARD_REWARD_LIMIT = 100;
type KnownTop100Rank = number | null | undefined;

export function XpGainProvider({ children }: PropsWithChildren) {
  const { profile: authProfile, refreshProfile } = useAuth();
  const [currentTotalXp, setCurrentTotalXp] = useState<number | null>(null);
  const [activePresentation, setActivePresentation] = useState<ActiveRewardPresentation | null>(null);
  const totalXpRef = useRef<number | null>(null);
  const authCoinBalance = authProfile?.wallet.coinBalance;
  const coinBalanceRef = useRef<number | null>(
    typeof authCoinBalance === 'number' ? Math.max(0, authCoinBalance) : null,
  );
  const coinRefreshTailRef = useRef<Promise<void>>(Promise.resolve());
  const queueRef = useRef<RewardQueueItem[]>([]);
  const isProcessingRef = useRef(false);
  const presentationIdRef = useRef(1);
  const presentationResolverRef = useRef<(() => void) | null>(null);
  const currentUserId = typeof authProfile?.id === 'number' && authProfile.id > 0 ? authProfile.id : null;
  const lastKnownTop100RankRef = useRef<KnownTop100Rank>(undefined);
  const leaderboardBaselineRequestIdRef = useRef(0);

  const getCurrentTop100LeaderboardEntry = useCallback(async (): Promise<StreakLeaderboardEntryDTO | null> => {
    if (currentUserId == null) {
      return null;
    }

    const leaderboard = await getStreakLeaderboard(LEADERBOARD_REWARD_LIMIT);
    return leaderboard.entries.find((entry) => entry.userId === currentUserId) ?? null;
  }, [currentUserId]);

  const checkLeaderboardRankChange = useCallback(async (): Promise<Omit<LeaderboardRankChangePresentation, 'id'> | null> => {
    if (currentUserId == null) {
      lastKnownTop100RankRef.current = null;
      return null;
    }

    try {
      const previousRank = lastKnownTop100RankRef.current;
      const currentEntry = await getCurrentTop100LeaderboardEntry();
      const currentRank = currentEntry?.rank ?? null;

      leaderboardBaselineRequestIdRef.current += 1;
      lastKnownTop100RankRef.current = currentRank;

      if (previousRank === undefined || currentEntry == null) {
        return null;
      }

      const { rank: nextRank, currentStreak } = currentEntry;

      if (previousRank == null || nextRank < previousRank) {
        return {
          previousRank,
          currentRank: nextRank,
          currentStreak,
        };
      }
    } catch (error) {
      console.error('Error checking streak leaderboard rank:', error);
    }

    return null;
  }, [currentUserId, getCurrentTop100LeaderboardEntry]);

  const refreshProfileXp = useCallback(async () => {
    const profile = await getProfile();
    const nextTotalXp = Math.max(0, profile.stats.totalXpEarned);

    totalXpRef.current = nextTotalXp;
    setCurrentTotalXp(nextTotalXp);

    return nextTotalXp;
  }, []);

  const handlePresentationComplete = useCallback(() => {
    setActivePresentation(null);
    const resolve = presentationResolverRef.current;
    presentationResolverRef.current = null;
    resolve?.();
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    while (queueRef.current.length > 0) {
      const nextItem = queueRef.current.shift();

      if (!nextItem) {
        continue;
      }

      if (nextItem.type === 'achievement') {
        await new Promise<void>((resolve) => {
          presentationResolverRef.current = resolve;
          setActivePresentation({
            type: 'achievement',
            item: {
              id: presentationIdRef.current,
              achievement: nextItem.achievement,
            },
          });
          presentationIdRef.current += 1;
        });
        continue;
      }

      if (nextItem.type === 'coin') {
        await new Promise<void>((resolve) => {
          presentationResolverRef.current = resolve;
          setActivePresentation({
            type: 'coin',
            item: {
              id: presentationIdRef.current,
              coinsAwarded: nextItem.coinsAwarded,
              fromCoinBalance: nextItem.fromCoinBalance,
              source: nextItem.source,
              toCoinBalance: nextItem.toCoinBalance,
            },
          });
          presentationIdRef.current += 1;
        });
        continue;
      }

      if (nextItem.type === 'dailyQuest') {
        await new Promise<void>((resolve) => {
          presentationResolverRef.current = resolve;
          setActivePresentation({
            type: 'dailyQuest',
            item: {
              id: presentationIdRef.current,
              dailyQuest: nextItem.dailyQuest,
            },
          });
          presentationIdRef.current += 1;
        });
        continue;
      }

      if (nextItem.type === 'leaderboardRankCheck') {
        const rankChange = await checkLeaderboardRankChange();

        if (rankChange) {
          await new Promise<void>((resolve) => {
            presentationResolverRef.current = resolve;
            setActivePresentation({
              type: 'leaderboardRankChange',
              item: {
                id: presentationIdRef.current,
                ...rankChange,
              },
            });
            presentationIdRef.current += 1;
          });
        }

        continue;
      }

      const { xpUpdate } = nextItem;
      const fromTotalXp = Math.max(0, xpUpdate.previousTotalXp);
      const toTotalXp = Math.max(fromTotalXp, xpUpdate.newTotalXp);

      totalXpRef.current = toTotalXp;
      setCurrentTotalXp(toTotalXp);

      if (xpUpdate.xpAwarded <= 0 || toTotalXp === fromTotalXp) {
        continue;
      }

      launchCelebration({
        leveledUp: xpUpdate.leveledUp,
        gainedXp: xpUpdate.xpAwarded,
      });

      await new Promise<void>((resolve) => {
        presentationResolverRef.current = resolve;
        setActivePresentation({
          type: 'xp',
          item: {
            id: presentationIdRef.current,
            fromTotalXp,
            toTotalXp,
            gainedXp: Math.max(0, xpUpdate.xpAwarded),
            level: Math.max(1, xpUpdate.level),
            xpIntoLevel: Math.max(0, xpUpdate.xpIntoLevel),
            xpPerLevel: Math.max(1, xpUpdate.xpPerLevel),
            maxLevel: Math.max(1, xpUpdate.maxLevel),
            currentLevelMinXp: Math.max(0, xpUpdate.currentLevelMinXp),
            nextLevelMinXp: xpUpdate.nextLevelMinXp,
            xpToNextLevel: Math.max(0, xpUpdate.xpToNextLevel),
            previousTotalXp: fromTotalXp,
            leveledUp: xpUpdate.leveledUp,
            source: nextItem.source,
          },
        });
        presentationIdRef.current += 1;
      });
    }

    isProcessingRef.current = false;
  }, [checkLeaderboardRankChange]);

  const showRewards = useCallback((input: RewardTrigger) => {
    if (input.xpUpdate) {
      queueRef.current.push({
        type: 'xp',
        xpUpdate: input.xpUpdate,
        source: input.source,
      });
    }

    if (input.dailyQuest) {
      queueRef.current.push({
        type: 'dailyQuest',
        dailyQuest: input.dailyQuest,
      });
    }

    input.newlyUnlockedAchievements?.forEach((achievement) => {
      queueRef.current.push({
        type: 'achievement',
        achievement,
      });
    });

    if (input.source === 'session') {
      queueRef.current.push({
        type: 'leaderboardRankCheck',
      });
    }

    void processQueue();
  }, [processQueue]);

  const showXpGain = useCallback((input: XpGainTrigger) => {
    showRewards(input);
  }, [showRewards]);

  const refreshCoinGain = useCallback((source: CoinGainSource) => {
    const refreshTask = coinRefreshTailRef.current
      .catch(() => undefined)
      .then(async () => {
        const previousCoinBalance = coinBalanceRef.current;
        const refreshedProfile = await refreshProfile();
        const nextCoinBalance = Math.max(0, refreshedProfile.wallet.coinBalance);

        coinBalanceRef.current = nextCoinBalance;

        if (previousCoinBalance == null || nextCoinBalance <= previousCoinBalance) {
          return;
        }

        queueRef.current.push({
          type: 'coin',
          coinsAwarded: nextCoinBalance - previousCoinBalance,
          fromCoinBalance: previousCoinBalance,
          source,
          toCoinBalance: nextCoinBalance,
        });
        void processQueue();
      });

    coinRefreshTailRef.current = refreshTask.catch(() => undefined);
    return refreshTask;
  }, [processQueue, refreshProfile]);

  useEffect(() => {
    if (typeof authCoinBalance !== 'number') {
      return;
    }

    coinBalanceRef.current = Math.max(0, authCoinBalance);
  }, [authCoinBalance]);

  useEffect(() => {
    const requestId = leaderboardBaselineRequestIdRef.current + 1;
    leaderboardBaselineRequestIdRef.current = requestId;
    lastKnownTop100RankRef.current = undefined;

    if (currentUserId == null) {
      lastKnownTop100RankRef.current = null;
      return undefined;
    }

    let isMounted = true;

    getCurrentTop100LeaderboardEntry()
      .then((entry) => {
        if (!isMounted || leaderboardBaselineRequestIdRef.current !== requestId) {
          return;
        }

        lastKnownTop100RankRef.current = entry?.rank ?? null;
      })
      .catch((error) => {
        console.error('Failed to load initial streak leaderboard rank:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, getCurrentTop100LeaderboardEntry]);

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        const nextTotalXp = Math.max(0, profile.stats.totalXpEarned);
        totalXpRef.current = nextTotalXp;
        setCurrentTotalXp(nextTotalXp);
      })
      .catch((error) => {
        console.error('Failed to load initial XP state:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <XpGainContext.Provider
      value={{
        showXpGain,
        showRewards,
        currentTotalXp,
        refreshCoinGain,
        refreshProfileXp,
      }}
    >
      {children}
      <XpGainBar
        item={activePresentation?.type === 'xp' ? activePresentation.item : null}
        onComplete={handlePresentationComplete}
      />
      <CoinGainBar
        item={activePresentation?.type === 'coin' ? activePresentation.item : null}
        onComplete={handlePresentationComplete}
      />
      <DailyQuestRewardBar
        item={activePresentation?.type === 'dailyQuest' ? activePresentation.item : null}
        onComplete={handlePresentationComplete}
      />
      <LeaderboardRankChangeBar
        item={activePresentation?.type === 'leaderboardRankChange' ? activePresentation.item : null}
        onComplete={handlePresentationComplete}
      />
      <AchievementUnlockBar
        item={activePresentation?.type === 'achievement' ? activePresentation.item : null}
        onComplete={handlePresentationComplete}
      />
    </XpGainContext.Provider>
  );
}
