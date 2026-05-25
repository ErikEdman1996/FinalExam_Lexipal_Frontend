import { createContext } from 'react';
import type { DailyQuestResponseDTO } from '../../api/api';

export interface RefreshDailyQuestOptions {
  silent?: boolean;
}

export interface CacheDailyQuestOptions {
  suppressCompletionProfileRefresh?: boolean;
}

export interface DailyQuestContextValue {
  dailyQuest: DailyQuestResponseDTO | null;
  isLoading: boolean;
  errorMessage: string | null;
  refreshDailyQuest: (options?: RefreshDailyQuestOptions) => Promise<DailyQuestResponseDTO>;
  cacheDailyQuest: (
    dailyQuest: DailyQuestResponseDTO | null,
    options?: CacheDailyQuestOptions,
  ) => void;
}

export const DailyQuestContext = createContext<DailyQuestContextValue | null>(null);
