import { useEffect, useRef, useState } from 'react';

interface TimerBarProps {
  durationMs: number;
  runKey: number | string;
  paused: boolean;
  onExpire: () => void;
}

export function TimerBar({ durationMs, runKey, paused, onExpire }: TimerBarProps) {
  const [progress, setProgress] = useState(1);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const firedRef = useRef<boolean>(false);

  useEffect(() => {
    firedRef.current = false;
    startRef.current = performance.now();
    setProgress(1);

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / durationMs);
      setProgress(remaining);

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, durationMs]);

  useEffect(() => {
    if (!paused) return;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, [paused]);

  const percent = Math.round(progress * 100);
  const tone =
    progress > 0.5 ? 'bg-brand' : progress > 0.25 ? 'bg-accent-strong' : 'bg-danger';

  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
      <div
        className={`h-full rounded-full transition-colors ${tone}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
