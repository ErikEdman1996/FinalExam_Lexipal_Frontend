import { CheckCircle2, Coins, Target, Zap } from 'lucide-react';
import type { DailyQuestResponseDTO } from '../api/api';
import { RewardPopupShell } from './RewardPopupShell';

export interface DailyQuestRewardPresentation {
  id: number;
  dailyQuest: DailyQuestResponseDTO;
}

interface DailyQuestRewardBarProps {
  item: DailyQuestRewardPresentation | null;
  onComplete: () => void;
}

function DailyQuestRewardBarItem({
  item,
  onComplete,
}: {
  item: DailyQuestRewardPresentation;
  onComplete: () => void;
}) {
  const questTitle = item.dailyQuest.title.trim() || 'Daily quest';

  return (
    <RewardPopupShell onComplete={onComplete}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Daily quest</p>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 size={22} className="shrink-0 text-accent-strong" aria-hidden="true" />
            <p className="text-xl font-semibold text-text sm:text-2xl">Quest complete</p>
          </div>
          <p className="mt-1 truncate text-sm text-text-muted">{questTitle}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong shadow-[0_10px_24px_rgba(154,74,66,0.14)]">
            <Zap size={14} aria-hidden="true" />
            +{item.dailyQuest.xpReward} XP
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-accent-strong shadow-[0_10px_24px_rgba(212,146,79,0.16)]">
            <Coins size={14} aria-hidden="true" />
            +{item.dailyQuest.coinReward} coins
          </span>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full w-full rounded-full bg-accent" />
      </div>

      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
        <Target size={13} aria-hidden="true" />
        {item.dailyQuest.targetValue} {item.dailyQuest.unit} finished
      </p>
    </RewardPopupShell>
  );
}

export function DailyQuestRewardBar({ item, onComplete }: DailyQuestRewardBarProps) {
  if (!item) {
    return null;
  }

  return <DailyQuestRewardBarItem key={item.id} item={item} onComplete={onComplete} />;
}
