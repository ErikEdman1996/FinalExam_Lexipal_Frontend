interface ProgressBarProps {
  current: number;
  total: number;
  color?: 'mint' | 'blue' | 'lavender' | 'peach';
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  current,
  total,
  color = 'mint',
  height = 'md',
}: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const progress = Math.max(0, Math.min(100, (current / safeTotal) * 100));

  const colorClassName = {
    mint: 'bg-[#A8E6CF]',
    blue: 'bg-[#B3D9FF]',
    lavender: 'bg-[#D4C5F9]',
    peach: 'bg-[#FFD3B6]',
  }[color];

  const heightClassName = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[height];

  return (
    <div className={`w-full bg-[#F0F2F5] rounded-full overflow-hidden ${heightClassName}`}>
      <div
        className={`${colorClassName} h-full rounded-full transition-all duration-300`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
