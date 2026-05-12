import { useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

export type RewardPopupPhase = 'enter' | 'visible' | 'exit';

interface RewardPopupRenderState {
  animationDurationMs: number;
  phase: RewardPopupPhase;
  prefersReducedMotion: boolean;
}

interface RewardPopupShellProps {
  children: ReactNode | ((state: RewardPopupRenderState) => ReactNode);
  onComplete: () => void;
}

export function RewardPopupShell({ children, onComplete }: RewardPopupShellProps) {
  const prefersReducedMotion = useReducedMotion() === true;
  const [phase, setPhase] = useState<RewardPopupPhase>('enter');
  const animationDurationMs = prefersReducedMotion ? 0 : 1200;
  const visibleHoldMs = prefersReducedMotion ? 3600 : 3900;
  const exitDurationMs = 260;

  useEffect(() => {
    const startTimeoutId = window.setTimeout(() => {
      setPhase('visible');
    }, 24);
    const exitTimeoutId = window.setTimeout(() => {
      setPhase('exit');
    }, animationDurationMs + visibleHoldMs);
    const completeTimeoutId = window.setTimeout(() => {
      onComplete();
    }, animationDurationMs + visibleHoldMs + exitDurationMs);

    return () => {
      window.clearTimeout(startTimeoutId);
      window.clearTimeout(exitTimeoutId);
      window.clearTimeout(completeTimeoutId);
    };
  }, [animationDurationMs, exitDurationMs, onComplete, visibleHoldMs]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        className={`w-full max-w-xl rounded-[28px] border border-border bg-surface/95 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 sm:p-5 ${
          phase === 'enter'
            ? 'translate-y-[-10px] opacity-0'
            : phase === 'exit'
              ? 'translate-y-[-8px] opacity-0'
              : 'translate-y-0 opacity-100'
        }`}
        aria-live="polite"
      >
        {typeof children === 'function'
          ? children({ animationDurationMs, phase, prefersReducedMotion })
          : children}
      </div>
    </div>
  );
}
