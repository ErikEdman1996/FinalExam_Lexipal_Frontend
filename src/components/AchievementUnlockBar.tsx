import { BadgeCheck } from 'lucide-react';
import type { AchievementResponseDTO } from '../api/api';
import { RewardPopupShell } from './RewardPopupShell';

export interface AchievementUnlockPresentation {
  id: number;
  achievement: AchievementResponseDTO;
}

interface AchievementUnlockBarProps {
  item: AchievementUnlockPresentation | null;
  onComplete: () => void;
}

const toReadableCategoryLabel = (category: string) => {
  return category
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Achievements';
};

function AchievementUnlockBarItem({
  item,
  onComplete,
}: {
  item: AchievementUnlockPresentation;
  onComplete: () => void;
}) {
  const { achievement } = item;
  const categoryLabel = toReadableCategoryLabel(achievement.category);

  return (
    <RewardPopupShell onComplete={onComplete}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Achievement unlocked</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="min-w-0 text-xl font-semibold text-text sm:text-2xl">{achievement.title}</p>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong">
              {categoryLabel}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">{achievement.description}</p>
        </div>

        <div className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong shadow-[0_10px_24px_rgba(154,74,66,0.14)]">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck size={14} />
            Unlocked
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

export function AchievementUnlockBar({ item, onComplete }: AchievementUnlockBarProps) {
  if (!item) {
    return null;
  }

  return <AchievementUnlockBarItem key={item.id} item={item} onComplete={onComplete} />;
}
