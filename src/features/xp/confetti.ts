import confetti, { type Options } from 'canvas-confetti';
import type { RarityTier } from '../../api/api';

const BIG_XP_THRESHOLD = 25;

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const burst = (options: Options) => {
  void confetti({
    resize: true,
    useWorker: true,
    ...options,
  });
};

interface CelebrationInput {
  leveledUp: boolean;
  gainedXp: number;
  rarityTier?: RarityTier;
}

export const launchCelebration = ({ leveledUp, gainedXp, rarityTier }: CelebrationInput) => {
  if (prefersReducedMotion()) {
    return;
  }

  if (leveledUp) {
    burst({
      particleCount: 150,
      spread: 78,
      startVelocity: 48,
      origin: { x: 0.25, y: 0.2 },
    });
    burst({
      particleCount: 150,
      spread: 78,
      startVelocity: 48,
      origin: { x: 0.75, y: 0.2 },
    });
    return;
  }

  if (rarityTier === 'MYTHIC') {
    burst({
      particleCount: 120,
      spread: 70,
      startVelocity: 42,
      scalar: 1.1,
      origin: { x: 0.5, y: 0.28 },
      colors: ['#ff7a59', '#ffd866', '#8be8ff', '#b084f5'],
    });
    return;
  }

  if (gainedXp >= BIG_XP_THRESHOLD) {
    burst({
      particleCount: 90,
      spread: 58,
      startVelocity: 38,
      origin: { x: 0.5, y: 0.24 },
      colors: ['#8fddb8', '#6fc8b1', '#ffd28f', '#ffffff'],
    });
  }
};
