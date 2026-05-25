import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { getTodayDailyQuest, type DailyQuestResponseDTO } from '../../api/api';
import { useAuth } from '../auth/useAuth';
import {
  DailyQuestContext,
  type CacheDailyQuestOptions,
  type DailyQuestContextValue,
  type RefreshDailyQuestOptions,
} from './DailyQuestContext';

const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export function DailyQuestProvider({ children }: PropsWithChildren) {
  const { profile, refreshProfile } = useAuth();
  const todayDateKey = formatLocalDateKey(new Date());
  const initialProfileDailyQuest = profile?.dailyQuest?.questDate === todayDateKey
    ? profile.dailyQuest
    : null;
  const [cachedDailyQuest, setCachedDailyQuest] = useState<DailyQuestResponseDTO | null>(null);
  const dailyQuest = cachedDailyQuest?.questDate === todayDateKey
    ? cachedDailyQuest
    : initialProfileDailyQuest;
  const [isLoading, setIsLoading] = useState(() => initialProfileDailyQuest == null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlightRefreshRef = useRef<Promise<DailyQuestResponseDTO> | null>(null);

  const cacheDailyQuest = useCallback((
    nextDailyQuest: DailyQuestResponseDTO | null,
    options?: CacheDailyQuestOptions,
  ) => {
    setCachedDailyQuest(nextDailyQuest);

    if (
      !options?.suppressCompletionProfileRefresh
      && dailyQuest?.status === 'ACTIVE'
      && nextDailyQuest?.status === 'COMPLETED'
    ) {
      void refreshProfile().catch((error) => {
        console.error('Error refreshing profile after daily quest completion:', error);
      });
    }
  }, [dailyQuest, refreshProfile]);

  const refreshDailyQuest = useCallback((options?: RefreshDailyQuestOptions) => {
    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    const refreshTask = Promise.resolve()
      .then(() => {
        if (!options?.silent) {
          setIsLoading(true);
        }

        setErrorMessage(null);
        return getTodayDailyQuest();
      })
      .then((nextDailyQuest) => {
        cacheDailyQuest(nextDailyQuest);
        setErrorMessage(null);
        return nextDailyQuest;
      })
      .catch((error) => {
        setErrorMessage('Could not load your daily quest right now.');
        throw error;
      })
      .finally(() => {
        setIsLoading(false);

        if (inFlightRefreshRef.current === refreshTask) {
          inFlightRefreshRef.current = null;
        }
      });

    inFlightRefreshRef.current = refreshTask;
    return refreshTask;
  }, [cacheDailyQuest]);

  useEffect(() => {
    if (dailyQuest?.questDate === todayDateKey) {
      return;
    }

    void refreshDailyQuest({ silent: dailyQuest != null }).catch((error) => {
      console.error('Error loading daily quest:', error);
    });
  }, [dailyQuest, dailyQuest?.questDate, refreshDailyQuest, todayDateKey]);

  const value = useMemo<DailyQuestContextValue>(() => ({
    dailyQuest,
    isLoading,
    errorMessage,
    refreshDailyQuest,
    cacheDailyQuest,
  }), [
    cacheDailyQuest,
    dailyQuest,
    errorMessage,
    isLoading,
    refreshDailyQuest,
  ]);

  return (
    <DailyQuestContext.Provider value={value}>
      {children}
    </DailyQuestContext.Provider>
  );
}
