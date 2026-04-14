import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { getProfile, type RarityTier, type XpUpdateResponseDTO } from '../../api/api';
import { XpGainBar, type XpGainPresentation } from '../../components/XpGainBar';
import { launchCelebration } from './confetti';

export interface XpGainTrigger {
  xpUpdate: XpUpdateResponseDTO;
  source?: 'capture' | 'challenge' | string;
  rarityTier?: RarityTier;
}

interface XpGainContextValue {
  showXpGain: (input: XpGainTrigger) => void;
  currentTotalXp: number | null;
  refreshProfileXp: () => Promise<number>;
}

const XpGainContext = createContext<XpGainContextValue | null>(null);

export function XpGainProvider({ children }: PropsWithChildren) {
  const [currentTotalXp, setCurrentTotalXp] = useState<number | null>(null);
  const [activePresentation, setActivePresentation] = useState<XpGainPresentation | null>(null);
  const totalXpRef = useRef<number | null>(null);
  const queueRef = useRef<XpGainTrigger[]>([]);
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
          id: presentationIdRef.current,
          fromTotalXp,
          toTotalXp,
          gainedXp: Math.max(0, xpUpdate.xpAwarded),
          level: Math.max(1, xpUpdate.level),
          xpIntoLevel: Math.max(0, xpUpdate.xpIntoLevel),
          xpPerLevel: Math.max(1, xpUpdate.xpPerLevel),
          leveledUp: xpUpdate.leveledUp,
          source: nextItem.source,
        });
        presentationIdRef.current += 1;
      });
    }

    isProcessingRef.current = false;
  }, [refreshProfileXp]);

  const showXpGain = useCallback((input: XpGainTrigger) => {
    queueRef.current.push({
      xpUpdate: input.xpUpdate,
      source: input.source,
      rarityTier: input.rarityTier,
    });

    void processQueue();
  }, [processQueue]);

  useEffect(() => {
    void refreshProfileXp().catch((error) => {
      console.error('Failed to load initial XP state:', error);
    });
  }, [refreshProfileXp]);

  return (
    <XpGainContext.Provider
      value={{
        showXpGain,
        currentTotalXp,
        refreshProfileXp,
      }}
    >
      {children}
      <XpGainBar item={activePresentation} onComplete={handlePresentationComplete} />
    </XpGainContext.Provider>
  );
}

export const useXpGain = () => {
  const context = useContext(XpGainContext);

  if (!context) {
    throw new Error('useXpGain must be used within an XpGainProvider.');
  }

  return context;
};
