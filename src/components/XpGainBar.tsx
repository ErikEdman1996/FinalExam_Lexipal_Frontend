import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getXpProgressMetaWithStep } from '../features/xp/xp';

export interface XpGainPresentation {
  id: number;
  fromTotalXp: number;
  toTotalXp: number;
  gainedXp: number;
  level: number;
  xpIntoLevel: number;
  xpPerLevel: number;
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

export function XpGainBar({ item, onComplete }: XpGainBarProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'visible' | 'exit'>('hidden');
  const [displayTotalXp, setDisplayTotalXp] = useState(0);
  const safeXpPerLevel = item?.xpPerLevel ?? 100;
  const safeToTotalXp = item?.toTotalXp ?? 0;
  const safeLevel = item?.level ?? 1;
  const safeXpIntoLevel = item?.xpIntoLevel ?? 0;
  const safeLeveledUp = item?.leveledUp ?? false;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  useEffect(() => {
    if (!item) {
      setPhase('hidden');
      return;
    }

    const animationDurationMs = prefersReducedMotion ? 0 : 1200;
    const visibleHoldMs = prefersReducedMotion ? 3600 : 3900;
    const exitDurationMs = 260;
    let animationFrameId: number | null = null;
    let exitTimeoutId: number | null = null;
    let completeTimeoutId: number | null = null;
    const xpDelta = Math.max(0, item.toTotalXp - item.fromTotalXp);

    setDisplayTotalXp(item.fromTotalXp);
    setPhase('enter');

    const startAnimation = () => {
      setPhase('visible');

      if (animationDurationMs === 0 || xpDelta === 0) {
        setDisplayTotalXp(item.toTotalXp);
        return;
      }

      const startTime = performance.now();

      const animate = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / animationDurationMs);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextDisplayedXp = item.fromTotalXp + (xpDelta * easedProgress);

        setDisplayTotalXp(nextDisplayedXp);

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(animate);
          return;
        }

        setDisplayTotalXp(item.toTotalXp);
      };

      animationFrameId = window.requestAnimationFrame(animate);
    };

    const startTimeoutId = window.setTimeout(startAnimation, 24);
    exitTimeoutId = window.setTimeout(() => {
      setPhase('exit');
    }, animationDurationMs + visibleHoldMs);
    completeTimeoutId = window.setTimeout(() => {
      setPhase('hidden');
      onComplete();
    }, animationDurationMs + visibleHoldMs + exitDurationMs);

    return () => {
      window.clearTimeout(startTimeoutId);

      if (animationFrameId != null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      if (exitTimeoutId != null) {
        window.clearTimeout(exitTimeoutId);
      }

      if (completeTimeoutId != null) {
        window.clearTimeout(completeTimeoutId);
      }
    };
  }, [item, onComplete, prefersReducedMotion]);

  const roundedDisplayedTotalXp = Math.round(displayTotalXp);
  const progressMeta = useMemo(
    () => getXpProgressMetaWithStep(roundedDisplayedTotalXp, safeXpPerLevel),
    [roundedDisplayedTotalXp, safeXpPerLevel],
  );
  const isAnimationComplete = roundedDisplayedTotalXp >= safeToTotalXp;
  const displayedLevel = isAnimationComplete ? safeLevel : progressMeta.level;
  const displayedXpIntoLevel = isAnimationComplete ? safeXpIntoLevel : progressMeta.xpIntoLevel;
  const displayedProgressPercent = isAnimationComplete
    ? (Math.max(0, safeXpIntoLevel) / Math.max(1, safeXpPerLevel)) * 100
    : progressMeta.progressPercent;

  if (!item || phase === 'hidden') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        className={`w-full max-w-xl rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-white/95 p-4 shadow-[0_20px_50px_rgba(31,41,55,0.16)] backdrop-blur-md transition-all duration-300 sm:p-5 ${
          phase === 'enter'
            ? 'translate-y-[-10px] opacity-0'
            : phase === 'exit'
              ? 'translate-y-[-8px] opacity-0'
              : 'translate-y-0 opacity-100'
        }`}
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-[#8A94A6]">{getSourceLabel(item.source)}</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xl font-semibold text-[#22324A] sm:text-2xl">
                {displayedXpIntoLevel}/{safeXpPerLevel} XP
              </p>
              <span className="rounded-full bg-[#EAFBF3] px-2.5 py-1 text-xs font-semibold text-[#2F7D5F]">
                Level {displayedLevel}
              </span>
              {safeLeveledUp && isAnimationComplete ? (
                <span className="rounded-full bg-[#FFF4D9] px-2.5 py-1 text-xs font-semibold text-[#A36F00]">
                  Level up
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-[#6A7687]">{roundedDisplayedTotalXp} total XP</p>
          </div>

          <div className="shrink-0 rounded-full bg-[linear-gradient(135deg,#EAFBF3_0%,#FDF4DE_100%)] px-3 py-1.5 text-sm font-semibold text-[#2F7D5F] shadow-[0_10px_24px_rgba(76,167,132,0.14)]">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} />
              +{item.gainedXp} XP
            </span>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EEF2F6]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#8FDDB8_0%,#6FC8B1_46%,#FFD28F_100%)]"
            style={{ width: `${Math.max(displayedProgressPercent, 4)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-[#7A8698]">
          <span>{progressMeta.levelStartXp} XP</span>
          <span>{progressMeta.levelEndXp} XP</span>
        </div>
      </div>
    </div>
  );
}
