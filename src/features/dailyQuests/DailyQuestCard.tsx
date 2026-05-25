import { CheckCircle2, Target, Zap, Coins } from 'lucide-react';
import { useDailyQuest } from './useDailyQuest';

interface DailyQuestCardProps {
  className?: string;
}

const formatQuestNumber = (value: number) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

function DailyQuestSkeleton({ className = '' }: DailyQuestCardProps) {
  return (
    <section
      className={`rounded-[24px] border border-border bg-surface p-4 shadow-[0_12px_26px_rgba(31,41,55,0.05)] ${className}`.trim()}
      aria-label="Loading daily quest"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 rounded-[16px] bg-surface-muted" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-36 rounded-full bg-surface-muted" />
          <div className="mt-3 h-3 w-24 rounded-full bg-surface-muted" />
          <div className="mt-4 h-2.5 rounded-full bg-surface-muted" />
        </div>
      </div>
    </section>
  );
}

export function DailyQuestCard({ className = '' }: DailyQuestCardProps) {
  const { dailyQuest, isLoading, errorMessage } = useDailyQuest();

  if (isLoading && !dailyQuest) {
    return <DailyQuestSkeleton className={className} />;
  }

  if (!dailyQuest) {
    return (
      <section
        className={`rounded-[24px] border border-border bg-surface p-4 text-sm text-text-muted shadow-[0_12px_26px_rgba(31,41,55,0.05)] ${className}`.trim()}
      >
        {errorMessage ?? 'Daily quest is unavailable right now.'}
      </section>
    );
  }

  const isCompleted = dailyQuest.status === 'COMPLETED';
  const targetValue = Math.max(0, dailyQuest.targetValue);
  const progressValue = Math.max(0, dailyQuest.progressValue);
  const progressPercent = isCompleted
    ? 100
    : targetValue > 0
      ? Math.max(0, Math.min(100, (progressValue / targetValue) * 100))
      : 0;
  const title = isCompleted ? 'Daily quest complete' : dailyQuest.title.trim() || 'Daily quest';
  const supportingText = isCompleted && dailyQuest.title.trim() ? dailyQuest.title.trim() : '';
  const progressText = `${formatQuestNumber(progressValue)} / ${formatQuestNumber(targetValue)} ${dailyQuest.unit}`;

  return (
    <section
      className={`rounded-[24px] border border-border bg-surface p-4 shadow-[0_12px_26px_rgba(31,41,55,0.05)] ${className}`.trim()}
      aria-label="Daily quest"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${
          isCompleted ? 'bg-accent-soft text-accent-strong' : 'bg-brand-soft text-brand-strong'
        }`}>
          {isCompleted ? <CheckCircle2 size={21} aria-hidden="true" /> : <Target size={21} aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1">
          <div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-text-subtle">Today</p>
              <h2 className="mt-1 text-lg font-semibold leading-snug text-text">{title}</h2>
              {supportingText ? (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">{supportingText}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium tabular-nums text-text">{progressText}</span>
              <span className="text-xs text-text-muted">{Math.round(progressPercent)}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${
                  isCompleted ? 'bg-accent' : 'bg-brand'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong">
              <Zap size={14} aria-hidden="true" />
              +{dailyQuest.xpReward} XP
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-accent-strong">
              <Coins size={14} aria-hidden="true" />
              +{dailyQuest.coinReward} coins{isCompleted ? ' earned' : ''}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
