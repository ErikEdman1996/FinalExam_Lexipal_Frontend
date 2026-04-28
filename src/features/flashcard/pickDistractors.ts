import type { FlashcardCandidate } from './types';

const shuffle = <T,>(list: T[]): T[] => {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
};

const shareAnyPos = (a: FlashcardCandidate, b: FlashcardCandidate): boolean => {
  if (a.partsOfSpeech.length === 0 || b.partsOfSpeech.length === 0) {
    return false;
  }
  const bSet = new Set(b.partsOfSpeech.map((p) => p.toLowerCase()));
  return a.partsOfSpeech.some((p) => bSet.has(p.toLowerCase()));
};

export const pickDistractors = (
  current: FlashcardCandidate,
  pool: FlashcardCandidate[],
  count: number,
): FlashcardCandidate[] => {
  const otherEntries = pool.filter(
    (entry) => entry.wordLookupId !== current.wordLookupId && entry.definition !== current.definition,
  );

  const samePos = shuffle(otherEntries.filter((entry) => shareAnyPos(current, entry)));
  const otherPos = shuffle(otherEntries.filter((entry) => !shareAnyPos(current, entry)));

  return [...samePos, ...otherPos].slice(0, count);
};
