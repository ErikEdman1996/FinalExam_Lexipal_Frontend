import { useContext } from 'react';
import { XpGainContext } from './XpGainContext';

export function useXpGain() {
  const context = useContext(XpGainContext);

  if (!context) {
    throw new Error('useXpGain must be used within an XpGainProvider.');
  }

  return context;
}
