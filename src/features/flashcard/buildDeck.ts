import { pickDistractors } from './pickDistractors';
import type { FlashcardCandidate, QuizCard, QuizOption } from './types';

const DEFAULT_DECK_SIZE = 10;
const DESIRED_OPTION_COUNT = 4;

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

export const buildDeck = (
  candidates: FlashcardCandidate[],
  size: number = DEFAULT_DECK_SIZE,
): QuizCard[] => {
  const pool = candidates;
  const maxOptions = Math.min(DESIRED_OPTION_COUNT, pool.length);

  if (maxOptions < 2) {
    return [];
  }

  const shuffled = shuffle(pool).slice(0, Math.min(size, pool.length));

  return shuffled.map((card) => {
    const distractors = pickDistractors(card, pool, maxOptions - 1);
    const correctOption: QuizOption = {
      codexEntryId: card.codexEntryId,
      text: card.definition,
    };
    const distractorOptions: QuizOption[] = distractors.map((distractor) => ({
      codexEntryId: distractor.codexEntryId,
      text: distractor.definition,
    }));

    const options = shuffle([correctOption, ...distractorOptions]);
    const correctIndex = options.findIndex(
      (option) => option.codexEntryId === card.codexEntryId,
    );

    return { card, options, correctIndex };
  });
};
