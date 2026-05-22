import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { RewardPopupShell, type RewardPopupPhase } from './RewardPopupShell';

export interface CoinGainPresentation {
  id: number;
  fromCoinBalance: number;
  toCoinBalance: number;
  coinsAwarded: number;
  source?: string;
}

interface CoinGainBarProps {
  item: CoinGainPresentation | null;
  onComplete: () => void;
}

const getSourceLabel = (source?: string) => {
  if (source === 'challenge') {
    return 'Challenge reward';
  }

  if (source === 'session') {
    return 'Reading reward';
  }

  return 'Coins earned';
};

function CoinGainBarContent({
  animationDurationMs,
  item,
  phase,
}: {
  animationDurationMs: number;
  item: CoinGainPresentation;
  phase: RewardPopupPhase;
}) {
  const [animatedBalance, setAnimatedBalance] = useState(() => item.fromCoinBalance);

  useEffect(() => {
    if (animationDurationMs === 0 || phase !== 'visible') {
      return undefined;
    }

    let animationFrameId: number | null = null;
    const coinDelta = Math.max(0, item.toCoinBalance - item.fromCoinBalance);
    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / animationDurationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedBalance(item.fromCoinBalance + (coinDelta * easedProgress));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      setAnimatedBalance(item.toCoinBalance);
    };

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameId != null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [animationDurationMs, item.fromCoinBalance, item.toCoinBalance, phase]);

  const displayedBalance = Math.round(animationDurationMs === 0 ? item.toCoinBalance : animatedBalance);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">{getSourceLabel(item.source)}</p>
          <p className="mt-2 text-xl font-semibold text-text sm:text-2xl">{displayedBalance} coins</p>
          <p className="mt-1 text-sm text-text-muted">Wallet balance</p>
        </div>

        <div className="shrink-0 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-strong shadow-[0_10px_24px_rgba(212,146,79,0.16)]">
          <span className="inline-flex items-center gap-1.5">
            <Coins size={14} />
            +{item.coinsAwarded} coins
          </span>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full w-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--t-accent) 0%, var(--t-brand) 100%)',
          }}
        />
      </div>
    </>
  );
}

function CoinGainBarItem({
  item,
  onComplete,
}: {
  item: CoinGainPresentation;
  onComplete: () => void;
}) {
  return (
    <RewardPopupShell onComplete={onComplete}>
      {({ animationDurationMs, phase }) => (
        <CoinGainBarContent
          animationDurationMs={animationDurationMs}
          item={item}
          phase={phase}
        />
      )}
    </RewardPopupShell>
  );
}

export function CoinGainBar({ item, onComplete }: CoinGainBarProps) {
  if (!item) {
    return null;
  }

  return <CoinGainBarItem key={item.id} item={item} onComplete={onComplete} />;
}
