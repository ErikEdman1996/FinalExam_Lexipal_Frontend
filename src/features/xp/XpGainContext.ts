import { createContext } from 'react';
import type { AchievementResponseDTO, RarityTier, XpUpdateResponseDTO } from '../../api/api';

export interface XpGainTrigger {
  xpUpdate: XpUpdateResponseDTO;
  source?: 'capture' | 'challenge' | 'session';
  rarityTier?: RarityTier;
  newlyUnlockedAchievements?: AchievementResponseDTO[];
}

export interface RewardTrigger {
  xpUpdate?: XpUpdateResponseDTO | null;
  source?: 'capture' | 'challenge' | 'session';
  rarityTier?: RarityTier;
  newlyUnlockedAchievements?: AchievementResponseDTO[];
}

export interface XpGainContextValue {
  showXpGain: (input: XpGainTrigger) => void;
  showRewards: (input: RewardTrigger) => void;
  currentTotalXp: number | null;
  refreshProfileXp: () => Promise<number>;
}

export const XpGainContext = createContext<XpGainContextValue | null>(null);
