import { CheckCircle2, XCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { FeedbackState, QuizCard } from '../../features/flashcard/types';

interface QuestionCardProps {
  quizCard: QuizCard;
  currentIndex: number;
  totalCards: number;
  pickedIndex: number | null;
  feedback: FeedbackState;
  locked: boolean;
  onPick: (index: number) => void;
  onEndSession: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const optionVisual = (
  index: number,
  correctIndex: number,
  pickedIndex: number | null,
  feedback: FeedbackState,
) => {
  if (feedback === 'none') {
    return 'border-border bg-surface-muted hover:bg-surface-alt';
  }

  const isCorrect = index === correctIndex;
  const isPicked = pickedIndex !== null && index === pickedIndex;

  if (isCorrect) {
    return 'border-brand bg-brand-soft text-brand-strong';
  }
  if (isPicked) {
    return 'border-danger bg-danger-soft text-danger';
  }
  return 'border-border bg-surface-muted opacity-60';
};

export function QuestionCard({
  quizCard,
  currentIndex,
  totalCards,
  pickedIndex,
  feedback,
  locked,
  onPick,
  onEndSession,
}: QuestionCardProps) {
  const reduceMotion = useReducedMotion();
  const { card, options, correctIndex } = quizCard;

  return (
    <motion.section
      key={currentIndex}
      initial={reduceMotion ? false : { x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.32, ease: EASE }}
      className="rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Card Progress</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">
            Card {currentIndex + 1} of {totalCards}
          </h2>
        </div>
        <button
          type="button"
          onClick={onEndSession}
          className="rounded-full bg-surface-muted px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-alt"
        >
          End session
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(180deg,var(--color-surface-alt)_0%,var(--color-surface)_100%)]">
        <div className="px-5 py-6 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Define this word</p>
          <h3 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-text sm:text-5xl">
            {card.lemma}
          </h3>
          {card.partsOfSpeech.length > 0 ? (
            <p className="mt-2 text-sm text-text-muted">{card.partsOfSpeech.join(' · ')}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((option, index) => {
          const isCorrect = index === correctIndex;
          const isPicked = pickedIndex === index;
          const showCheck = feedback !== 'none' && isCorrect;
          const showCross = feedback === 'wrong' && isPicked;

          return (
            <button
              key={`${option.wordLookupId}-${index}`}
              type="button"
              disabled={locked}
              onClick={() => onPick(index)}
              className={`relative flex items-start gap-3 rounded-[22px] border px-4 py-3 text-left text-sm leading-relaxed transition-all duration-200 disabled:cursor-default ${optionVisual(
                index,
                correctIndex,
                pickedIndex,
                feedback,
              )}`}
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted">
                {OPTION_LABELS[index] ?? index + 1}
              </span>
              <span className="flex-1 text-text">{option.text}</span>
              {showCheck ? (
                <CheckCircle2 size={18} className="shrink-0 text-brand-strong" />
              ) : null}
              {showCross ? <XCircle size={18} className="shrink-0 text-danger" /> : null}
            </button>
          );
        })}
      </div>

      {feedback === 'timeout' ? (
        <p className="mt-4 text-sm font-medium text-danger">Time's up — correct answer highlighted.</p>
      ) : null}
    </motion.section>
  );
}
