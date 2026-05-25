import { useContext } from 'react';
import { DailyQuestContext } from './DailyQuestContext';

export function useDailyQuest() {
  const context = useContext(DailyQuestContext);

  if (!context) {
    throw new Error('useDailyQuest must be used within a DailyQuestProvider.');
  }

  return context;
}
