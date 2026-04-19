import { AnimatePresence, motion } from 'motion/react';
import { Flame } from 'lucide-react';

interface StreakChipProps {
  streak: number;
}

const labelFor = (streak: number): string | null => {
  if (streak >= 10) return 'Unstoppable!';
  if (streak >= 5) return '5 streak!';
  if (streak >= 3) return 'On fire!';
  return null;
};

export function StreakChip({ streak }: StreakChipProps) {
  const label = labelFor(streak);
  const chipKey = `${streak >= 10 ? 'ten' : streak >= 5 ? 'five' : streak >= 3 ? 'three' : 'none'}`;

  return (
    <AnimatePresence mode="wait">
      {label ? (
        <motion.span
          key={chipKey}
          initial={{ scale: 0.8, y: 8, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: -4, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong"
        >
          <Flame size={14} />
          {label}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
