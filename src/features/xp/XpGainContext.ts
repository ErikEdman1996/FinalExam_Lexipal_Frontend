import { createContext } from 'react';
import type { AchievementResponseDTO, DailyQuestResponseDTO, XpUpdateResponseDTO } from '../../api/api';

export type RewardSource = 'challenge' | 'session';

export type CoinGainSource = RewardSource;

export interface XpGainTrigger {
  xpUpdate: XpUpdateResponseDTO;
  source?: RewardSource;
  newlyUnlockedAchievements?: AchievementResponseDTO[];
}

export interface RewardTrigger {
  xpUpdate?: XpUpdateResponseDTO | null;
  source?: RewardSource;
  newlyUnlockedAchievements?: AchievementResponseDTO[];
  dailyQuest?: DailyQuestResponseDTO | null;
}

export interface XpGainContextValue {
  showXpGain: (input: XpGainTrigger) => void;
  showRewards: (input: RewardTrigger) => void;
  currentTotalXp: number | null;
  refreshCoinGain: (source: CoinGainSource) => Promise<void>;
  refreshProfileXp: () => Promise<number>;
}

export const XpGainContext = createContext<XpGainContextValue | null>(null);
