import { useCallback, useMemo, useState } from 'react';
import type { AttemptResult, FeedbackState, GamePhase, QuizCard } from './types';

interface GameState {
  phase: GamePhase;
  cards: QuizCard[];
  index: number;
  pickedIndex: number | null;
  timedOut: boolean;
  streak: number;
  bestStreak: number;
  timeStartedAt: number;
  results: AttemptResult[];
}

const initialState: GameState = {
  phase: 'idle',
  cards: [],
  index: 0,
  pickedIndex: null,
  timedOut: false,
  streak: 0,
  bestStreak: 0,
  timeStartedAt: 0,
  results: [],
};

export interface FlashcardGame {
  phase: GamePhase;
  currentCard: QuizCard | null;
  currentIndex: number;
  totalCards: number;
  pickedIndex: number | null;
  timedOut: boolean;
  feedback: FeedbackState;
  streak: number;
  bestStreak: number;
  results: AttemptResult[];
  correctCount: number;
  wrongCount: number;
  totalXp: number;
  start: (cards: QuizCard[]) => void;
  pick: (index: number) => { correct: boolean; elapsedMs: number };
  timeout: () => void;
  applyXp: (xp: number) => void;
  advance: () => void;
  reset: () => void;
}

export function useFlashcardGame(): FlashcardGame {
  const [state, setState] = useState<GameState>(initialState);

  const start = useCallback((cards: QuizCard[]) => {
    setState({
      ...initialState,
      cards,
      phase: cards.length > 0 ? 'question' : 'ended',
      timeStartedAt: Date.now(),
    });
  }, []);

  const pick = useCallback(
    (index: number) => {
      const elapsedMs = Date.now() - state.timeStartedAt;
      const currentCard = state.cards[state.index];
      const correct = currentCard ? index === currentCard.correctIndex : false;
      const nextStreak = correct ? state.streak + 1 : 0;
      const result: AttemptResult = {
        codexEntryId: currentCard?.card.codexEntryId ?? 0,
        lemma: currentCard?.card.lemma ?? '',
        correct,
        timedOut: false,
        elapsedMs,
        xpAwarded: 0,
      };

      setState((prev) => ({
        ...prev,
        phase: 'locked',
        pickedIndex: index,
        timedOut: false,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        results: [...prev.results, result],
      }));

      return { correct, elapsedMs };
    },
    [state.cards, state.index, state.streak, state.timeStartedAt],
  );

  const timeout = useCallback(() => {
    const elapsedMs = Date.now() - state.timeStartedAt;
    const currentCard = state.cards[state.index];
    const result: AttemptResult = {
      codexEntryId: currentCard?.card.codexEntryId ?? 0,
      lemma: currentCard?.card.lemma ?? '',
      correct: false,
      timedOut: true,
      elapsedMs,
      xpAwarded: 0,
    };

    setState((prev) => ({
      ...prev,
      phase: 'locked',
      pickedIndex: null,
      timedOut: true,
      streak: 0,
      results: [...prev.results, result],
    }));
  }, [state.cards, state.index, state.timeStartedAt]);

  const applyXp = useCallback((xp: number) => {
    setState((prev) => {
      if (prev.results.length === 0) {
        return prev;
      }
      const nextResults = [...prev.results];
      const last = nextResults[nextResults.length - 1];
      nextResults[nextResults.length - 1] = { ...last, xpAwarded: xp };
      return { ...prev, results: nextResults };
    });
  }, []);

  const advance = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.index + 1;
      if (nextIndex >= prev.cards.length) {
        return { ...prev, phase: 'ended', pickedIndex: null, timedOut: false };
      }
      return {
        ...prev,
        phase: 'question',
        index: nextIndex,
        pickedIndex: null,
        timedOut: false,
        timeStartedAt: Date.now(),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const feedback: FeedbackState = useMemo(() => {
    if (state.phase !== 'locked') return 'none';
    if (state.timedOut) return 'timeout';
    const current = state.cards[state.index];
    if (!current || state.pickedIndex === null) return 'none';
    return state.pickedIndex === current.correctIndex ? 'correct' : 'wrong';
  }, [state.phase, state.timedOut, state.cards, state.index, state.pickedIndex]);

  const correctCount = state.results.filter((r) => r.correct).length;
  const wrongCount = state.results.length - correctCount;
  const totalXp = state.results.reduce((sum, r) => sum + Math.max(0, r.xpAwarded), 0);

  return {
    phase: state.phase,
    currentCard: state.cards[state.index] ?? null,
    currentIndex: state.index,
    totalCards: state.cards.length,
    pickedIndex: state.pickedIndex,
    timedOut: state.timedOut,
    feedback,
    streak: state.streak,
    bestStreak: state.bestStreak,
    results: state.results,
    correctCount,
    wrongCount,
    totalXp,
    start,
    pick,
    timeout,
    applyXp,
    advance,
    reset,
  };
}
