import { createContext } from 'react';
import type { RarityTier, XpUpdateResponseDTO } from '../../api/api';

export interface XpGainTrigger {
  xpUpdate: XpUpdateResponseDTO;
  source?: 'capture' | 'challenge' | 'session';
  rarityTier?: RarityTier;
}

export interface XpGainContextValue {
  showXpGain: (input: XpGainTrigger) => void;
  currentTotalXp: number | null;
  refreshProfileXp: () => Promise<number>;
}

export const XpGainContext = createContext<XpGainContextValue | null>(null);
