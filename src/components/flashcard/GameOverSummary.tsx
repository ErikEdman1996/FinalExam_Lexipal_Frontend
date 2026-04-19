import { RotateCcw } from 'lucide-react';
import { Button } from '../Button';
import type { AttemptResult } from '../../features/flashcard/types';

interface GameOverSummaryProps {
  results: AttemptResult[];
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  bestStreak: number;
  totalXp: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameOverSummary({
  results,
  totalCards,
  correctCount,
  wrongCount,
  bestStreak,
  totalXp,
  onPlayAgain,
  onBackToMenu,
}: GameOverSummaryProps) {
  const attempted = results.length;
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

  return (
    <section className="rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Session Summary</p>
      <h2 className="mt-2 text-3xl font-semibold text-text">Round complete</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        {correctCount === totalCards
          ? 'Perfect round — every card right.'
          : 'Your results are saved. Backend-awarded XP is reflected below.'}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[22px] bg-surface-muted p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Accuracy</p>
          <p className="mt-2 text-2xl font-semibold text-text">{accuracy}%</p>
        </div>
        <div className="rounded-[22px] bg-brand-soft p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-strong">Correct</p>
          <p className="mt-2 text-2xl font-semibold text-brand-strong">
            {correctCount}/{totalCards}
          </p>
        </div>
        <div className="rounded-[22px] bg-danger-soft p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-danger">Wrong</p>
          <p className="mt-2 text-2xl font-semibold text-danger">{wrongCount}</p>
        </div>
        <div className="rounded-[22px] bg-accent-soft p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-accent-strong">XP Earned</p>
          <p className="mt-2 text-2xl font-semibold text-accent-strong">{totalXp}</p>
        </div>
      </div>

      {bestStreak >= 3 ? (
        <p className="mt-4 text-sm text-text-muted">
          Best streak this round: <span className="font-semibold text-text">{bestStreak}</span>
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Per-card recap</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {results.map((result, index) => (
              <div
                key={`${result.codexEntryId}-${index}`}
                className={`flex min-w-[6rem] flex-col items-center gap-1 rounded-[18px] px-3 py-2 text-xs ${
                  result.correct ? 'bg-brand-soft text-brand-strong' : 'bg-danger-soft text-danger'
                }`}
              >
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    result.correct ? 'bg-brand-strong' : 'bg-danger'
                  }`}
                />
                <span className="max-w-[10rem] truncate font-medium text-text">{result.lemma}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onPlayAgain}>
          <RotateCcw size={18} className="mr-2 inline-flex" />
          Play again
        </Button>
        <Button variant="outline" onClick={onBackToMenu}>
          Back to menu
        </Button>
      </div>
    </section>
  );
}
