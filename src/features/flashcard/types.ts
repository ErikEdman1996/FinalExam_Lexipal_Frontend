import {
  extractDefinitionFromDefinitions,
  extractPartsOfSpeechFromDefinitions,
  type CodexEntryReadResponseDTO,
} from '../../api/api';

export interface FlashcardCandidate {
  codexEntryId: number;
  lemma: string;
  definition: string;
  source: string | null;
  createdAt: string;
  partsOfSpeech: string[];
}

export interface QuizOption {
  codexEntryId: number;
  text: string;
}

export interface QuizCard {
  card: FlashcardCandidate;
  options: QuizOption[];
  correctIndex: number;
}

export interface AttemptResult {
  codexEntryId: number;
  lemma: string;
  correct: boolean;
  timedOut: boolean;
  elapsedMs: number;
  xpAwarded: number;
}

export type GamePhase = 'idle' | 'question' | 'locked' | 'ended';

export type FeedbackState = 'none' | 'correct' | 'wrong' | 'timeout';

export const toFlashcardCandidate = (
  entry: CodexEntryReadResponseDTO,
): FlashcardCandidate | null => {
  const definition = entry.specificDefinition || extractDefinitionFromDefinitions(entry.definitions);

  if (!definition) {
    return null;
  }

  return {
    codexEntryId: entry.id,
    lemma: entry.lemma,
    definition,
    source: entry.source,
    createdAt: entry.createdAt,
    partsOfSpeech: extractPartsOfSpeechFromDefinitions(entry.definitions),
  };
};
