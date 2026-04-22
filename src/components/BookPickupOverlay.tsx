import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { BookCard, type BookData } from './BookCard';

interface BookPickupOverlayProps {
  book: BookData;
  originRect: DOMRect;
  onComplete: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1.1;
const MOVE_TIMES = [0, 0.25, 0.6, 1];

export function BookPickupOverlay({ book, originRect, onComplete }: BookPickupOverlayProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      onComplete();
    }
  }, [reduceMotion, onComplete]);

  if (reduceMotion) {
    return null;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const targetWidth = Math.min(vw * 0.8, 400);
  const targetScale = targetWidth / originRect.width;
  const travelX = vw / 2 - (originRect.left + originRect.width / 2);
  const travelY = vh / 2 - (originRect.top + originRect.height / 2);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ perspective: 1600 }}
      aria-hidden
    >
      <motion.div
        className="page-bg absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          duration: DURATION,
          times: [0, 0.5, 0.8, 1],
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: originRect.top,
          left: originRect.left,
          width: originRect.width,
          height: originRect.height,
        }}
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, 0, travelX, travelX],
          y: [0, -8, travelY, travelY],
          scale: [1, 1.06, targetScale, targetScale],
        }}
        transition={{
          duration: DURATION,
          times: MOVE_TIMES,
          ease: EASE,
        }}
      >
        <motion.div
          className="h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            backfaceVisibility: 'hidden',
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: [0, 0, 0, -165] }}
          transition={{
            duration: DURATION,
            times: MOVE_TIMES,
            ease: EASE,
          }}
          onAnimationComplete={onComplete}
        >
          <div className="h-full w-full drop-shadow-[0_24px_48px_rgba(31,41,55,0.28)]">
            <BookCard book={book} />
          </div>
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}
