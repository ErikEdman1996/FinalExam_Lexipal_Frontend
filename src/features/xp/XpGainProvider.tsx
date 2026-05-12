import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { getProfile, type AchievementResponseDTO } from '../../api/api';
import {
  AchievementUnlockBar,
  type AchievementUnlockPresentation,
} from '../../components/AchievementUnlockBar';
import { XpGainBar, type XpGainPresentation } from '../../components/XpGainBar';
import { launchCelebration } from './confetti';
import { XpGainContext, type RewardTrigger, type XpGainTrigger } from './XpGainContext';

type RewardQueueItem =
  | ({ type: 'xp' } & Pick<XpGainTrigger, 'xpUpdate' | 'source' | 'rarityTier'>)
  | {
    type: 'achievement';
    achievement: AchievementResponseDTO;
  };

type ActiveRewardPresentation =
  | {
    type: 'xp';
    item: XpGainPresentation;
  }
  | {
    type: 'achievement';
    item: AchievementUnlockPresentation;
  };

export function XpGainProvider({ children }: PropsWithChildren) {
  const [currentTotalXp, setCurrentTotalXp] = useState<number | null>(null);
  const [activePresentation, setActivePresentation] = useState<ActiveRewardPresentation | null>(null);
  const totalXpRef = useRef<number | null>(null);
  const queueRef = useRef<RewardQueueItem[]>([]);
  const isProcessingRef = useRef(false);
  const presentationIdRef = useRef(1);
  const presentationResolverRef = useRef<(() => void) | null>(null);

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
        rarityTier: nextItem.rarityTier,
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
  }, []);

  const showRewards = useCallback((input: RewardTrigger) => {
    if (input.xpUpdate) {
      queueRef.current.push({
        type: 'xp',
        xpUpdate: input.xpUpdate,
        source: input.source,
        rarityTier: input.rarityTier,
      });
    }

    input.newlyUnlockedAchievements?.forEach((achievement) => {
      queueRef.current.push({
        type: 'achievement',
        achievement,
      });
    });

    void processQueue();
  }, [processQueue]);

  const showXpGain = useCallback((input: XpGainTrigger) => {
    showRewards(input);
  }, [showRewards]);

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
        refreshProfileXp,
      }}
    >
      {children}
      <XpGainBar
        item={activePresentation?.type === 'xp' ? activePresentation.item : null}
        onComplete={handlePresentationComplete}
      />
      <AchievementUnlockBar
        item={activePresentation?.type === 'achievement' ? activePresentation.item : null}
        onComplete={handlePresentationComplete}
      />
    </XpGainContext.Provider>
  );
}
