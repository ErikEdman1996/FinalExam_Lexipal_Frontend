import { TrendingUp, Trophy } from 'lucide-react';
import { RewardPopupShell } from './RewardPopupShell';

export interface LeaderboardRankChangePresentation {
  id: number;
  previousRank: number | null;
  currentRank: number;
  currentStreak: number;
}

interface LeaderboardRankChangeBarProps {
  item: LeaderboardRankChangePresentation | null;
  onComplete: () => void;
}

const formatStreakDays = (value: number) => {
  const safeValue = Math.max(0, value);
  return `${safeValue} ${safeValue === 1 ? 'day' : 'days'}`;
};

function LeaderboardRankChangeBarItem({
  item,
  onComplete,
}: {
  item: LeaderboardRankChangePresentation;
  onComplete: () => void;
}) {
  const enteredTop100 = item.previousRank == null;
  const placesGained = item.previousRank == null
    ? 0
    : Math.max(0, item.previousRank - item.currentRank);
  const headline = enteredTop100
    ? 'You made the top 100'
    : `Up ${placesGained} ${placesGained === 1 ? 'place' : 'places'}`;

  return (
    <RewardPopupShell onComplete={onComplete}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Leaderboard climb</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TrendingUp size={22} className="shrink-0 text-accent-strong" aria-hidden="true" />
            <p className="min-w-0 text-xl font-semibold text-text sm:text-2xl">{headline}</p>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {formatStreakDays(item.currentStreak)} on the streak leaderboard
          </p>
        </div>

        <div className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong shadow-[0_10px_24px_rgba(154,74,66,0.14)]">
          <span className="inline-flex items-center gap-1.5">
            <Trophy size={14} aria-hidden="true" />
            Rank #{item.currentRank}
          </span>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, var(--t-brand) 0%, var(--t-accent) 100%)',
          }}
        />
      </div>
    </RewardPopupShell>
  );
}

export function LeaderboardRankChangeBar({ item, onComplete }: LeaderboardRankChangeBarProps) {
  if (!item) {
    return null;
  }

  return <LeaderboardRankChangeBarItem key={item.id} item={item} onComplete={onComplete} />;
}
