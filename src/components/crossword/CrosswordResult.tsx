import { RefreshCw, Sparkles } from 'lucide-react';
import type { CrosswordSubmitResponse } from '../../api/api';
import { Button } from '../Button';

interface CrosswordResultProps {
  result: CrosswordSubmitResponse;
  onNewCrossword: () => void;
}

export function CrosswordResult({ result, onNewCrossword }: CrosswordResultProps) {
  const passed = result.result === 'PASS';
  const xpAwarded = result.attempt.xpAwarded;
  const leveledUp = result.attempt.xpUpdate?.leveledUp ?? false;

  return (
    <div className="rounded-[26px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              passed
                ? 'bg-brand-soft text-brand-strong'
                : 'bg-danger-soft text-danger'
            }`}
          >
            {passed ? 'Passed' : 'Try again'}
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-text">
            {result.correctCount}
            <span className="text-text-subtle"> / {result.totalEntries}</span>
            <span className="ml-2 text-base font-medium text-text-muted">words correct</span>
          </h2>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-strong">
            <Sparkles size={14} />
            +{xpAwarded} XP
          </span>
          {leveledUp ? (
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
              Level up!
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onNewCrossword} className="inline-flex items-center gap-2">
          <RefreshCw size={16} />
          New crossword
        </Button>
      </div>
    </div>
  );
}
