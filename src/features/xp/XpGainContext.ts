import { createContext } from 'react';
import type { AchievementResponseDTO, RarityTier, XpUpdateResponseDTO } from '../../api/api';

export type RewardSource = 'capture' | 'challenge' | 'session';

export type CoinGainSource = Exclude<RewardSource, 'capture'>;

export interface XpGainTrigger {
  xpUpdate: XpUpdateResponseDTO;
  source?: RewardSource;
  rarityTier?: RarityTier;
  newlyUnlockedAchievements?: AchievementResponseDTO[];
}

export interface RewardTrigger {
  xpUpdate?: XpUpdateResponseDTO | null;
  source?: RewardSource;
  rarityTier?: RarityTier;
  newlyUnlockedAchievements?: AchievementResponseDTO[];
}

export interface XpGainContextValue {
  showXpGain: (input: XpGainTrigger) => void;
  showRewards: (input: RewardTrigger) => void;
  currentTotalXp: number | null;
  refreshCoinGain: (source: CoinGainSource) => Promise<void>;
  refreshProfileXp: () => Promise<number>;
}

export const XpGainContext = createContext<XpGainContextValue | null>(null);
