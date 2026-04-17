export type ProgressColor = 'brand' | 'accent';

interface ProgressBarProps {
  current: number;
  total: number;
  color?: ProgressColor;
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  current,
  total,
  color = 'brand',
  height = 'md',
}: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const progress = Math.max(0, Math.min(100, (current / safeTotal) * 100));

  const colorClassName = color === 'accent' ? 'bg-accent' : 'bg-brand';

  const heightClassName = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[height];

  return (
    <div className={`w-full bg-surface-muted rounded-full overflow-hidden ${heightClassName}`}>
      <div
        className={`${colorClassName} h-full rounded-full transition-all duration-300`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
