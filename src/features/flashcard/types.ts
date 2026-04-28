import {
  extractDefinitionFromDefinitions,
  extractPartsOfSpeechFromDefinitions,
  type WordLookupReadResponseDTO,
} from '../../api/api';

export interface FlashcardCandidate {
  wordLookupId: number;
  lemma: string;
  definition: string;
  source: string | null;
  lastLookedUpAt: string;
  partsOfSpeech: string[];
}

export interface QuizOption {
  wordLookupId: number;
  text: string;
}

export interface QuizCard {
  card: FlashcardCandidate;
  options: QuizOption[];
  correctIndex: number;
}

export interface AttemptResult {
  wordLookupId: number;
  lemma: string;
  correct: boolean;
  timedOut: boolean;
  elapsedMs: number;
  xpAwarded: number;
}

export type GamePhase = 'idle' | 'question' | 'locked' | 'ended';

export type FeedbackState = 'none' | 'correct' | 'wrong' | 'timeout';

export const toFlashcardCandidate = (
  entry: WordLookupReadResponseDTO,
): FlashcardCandidate | null => {
  const definition = extractDefinitionFromDefinitions(entry.definitions);

  if (!definition) {
    return null;
  }

  return {
    wordLookupId: entry.id,
    lemma: entry.lemma,
    definition,
    source: entry.source,
    lastLookedUpAt: entry.lastLookedUpAt,
    partsOfSpeech: extractPartsOfSpeechFromDefinitions(entry.definitions),
  };
};
