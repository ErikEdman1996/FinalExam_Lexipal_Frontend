import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { RewardPopupShell, type RewardPopupPhase } from './RewardPopupShell';

export interface XpGainPresentation {
  id: number;
  fromTotalXp: number;
  toTotalXp: number;
  gainedXp: number;
  level: number;
  xpIntoLevel: number;
  xpPerLevel: number;
  maxLevel: number;
  currentLevelMinXp: number;
  nextLevelMinXp: number | null;
  xpToNextLevel: number;
  previousTotalXp: number;
  leveledUp: boolean;
  source?: string;
}

interface XpGainBarProps {
  item: XpGainPresentation | null;
  onComplete: () => void;
}

const getSourceLabel = (source?: string) => {
  if (source === 'capture') {
    return 'Word captured';
  }

  if (source === 'challenge') {
    return 'Challenge XP';
  }

  return 'XP gained';
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

function XpGainBarContent({
  item,
  phase,
  animationDurationMs,
}: {
  item: XpGainPresentation;
  phase: RewardPopupPhase;
  animationDurationMs: number;
}) {
  const isAtMaxLevel = item.level >= item.maxLevel;
  const finalProgressPercent = isAtMaxLevel
    ? 100
    : clampPercent((item.xpIntoLevel / Math.max(1, item.xpPerLevel)) * 100);
  const startProgressPercent = item.leveledUp
    ? 0
    : clampPercent(((item.previousTotalXp - item.currentLevelMinXp) / Math.max(1, item.xpPerLevel)) * 100);
  const xpDelta = Math.max(0, item.toTotalXp - item.fromTotalXp);
  const shouldShowFinalValues = animationDurationMs === 0 || xpDelta === 0;
  const [progressPercent, setProgressPercent] = useState(startProgressPercent);
  const [displayTotalXp, setDisplayTotalXp] = useState(() => item.fromTotalXp);

  useEffect(() => {
    if (phase !== 'visible') {
      return undefined;
    }

    let animationFrameId: number | null = null;

    if (shouldShowFinalValues) {
      return undefined;
    }

    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / animationDurationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextDisplayedXp = item.fromTotalXp + (xpDelta * easedProgress);
      const nextPercent = startProgressPercent + (finalProgressPercent - startProgressPercent) * easedProgress;

      setDisplayTotalXp(nextDisplayedXp);
      setProgressPercent(nextPercent);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      setDisplayTotalXp(item.toTotalXp);
      setProgressPercent(finalProgressPercent);
    };

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameId != null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [animationDurationMs, phase, item, startProgressPercent, finalProgressPercent, shouldShowFinalValues, xpDelta]);

  const roundedDisplayedTotalXp = Math.round(shouldShowFinalValues ? item.toTotalXp : displayTotalXp);
  const displayedProgressWidth = `${Math.max(
    shouldShowFinalValues ? finalProgressPercent : progressPercent,
    isAtMaxLevel ? 100 : 4,
  )}%`;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">{getSourceLabel(item.source)}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xl font-semibold text-text sm:text-2xl">
              {isAtMaxLevel ? 'MAX' : `${item.xpIntoLevel}/${item.xpPerLevel} XP`}
            </p>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong">
              Level {item.level}
            </span>
            {item.leveledUp ? (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong">
                Level up
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-text-muted">{roundedDisplayedTotalXp} total XP</p>
        </div>

        <div className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong shadow-[0_10px_24px_rgba(154,74,66,0.14)]">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={14} />
            +{item.gainedXp} XP
          </span>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full transition-[width] duration-150 ease-out"
          style={{
            width: displayedProgressWidth,
            background: 'linear-gradient(90deg, var(--t-brand) 0%, var(--t-accent) 100%)',
          }}
        />
      </div>

      {!isAtMaxLevel ? (
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>{item.currentLevelMinXp} XP</span>
          <span>{item.nextLevelMinXp ?? item.currentLevelMinXp + item.xpPerLevel} XP</span>
        </div>
      ) : null}
    </>
  );
}

function XpGainBarItem({
  item,
  onComplete,
}: {
  item: XpGainPresentation;
  onComplete: () => void;
}) {
  return (
    <RewardPopupShell onComplete={onComplete}>
      {({ animationDurationMs, phase }) => (
        <XpGainBarContent
          animationDurationMs={animationDurationMs}
          item={item}
          phase={phase}
        />
      )}
    </RewardPopupShell>
  );
}

export function XpGainBar({ item, onComplete }: XpGainBarProps) {
  if (!item) {
    return null;
  }

  return <XpGainBarItem key={item.id} item={item} onComplete={onComplete} />;
}
