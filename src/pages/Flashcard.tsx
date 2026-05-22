import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { QuestionCard } from '../components/flashcard/QuestionCard';
import { TimerBar } from '../components/flashcard/TimerBar';
import { StreakChip } from '../components/flashcard/StreakChip';
import { GameOverSummary } from '../components/flashcard/GameOverSummary';
import { useXpGain } from '../features/xp/useXpGain';
import { useFlashcardGame } from '../features/flashcard/useFlashcardGame';
import { buildDeck } from '../features/flashcard/buildDeck';
import { toFlashcardCandidate, type FlashcardCandidate } from '../features/flashcard/types';
import { formatDateValue } from '../utils/formatting';
import {
  createChallengeAttempt,
  extractDefinitionFromDefinitions,
  getChallengeAttempts,
  getChallenges,
  getWordLookups,
  type Challenge,
  type ChallengeAttempt,
} from '../api/api';

const CARD_DURATION_MS = 10000;
const FEEDBACK_CORRECT_MS = 800;
const FEEDBACK_WRONG_MS = 1200;
const DECK_SIZE = 10;
const MIN_LOOKUP_WORDS = 2;

interface AttemptHistorySectionProps {
  attempts: ChallengeAttempt[];
}

const formatAttemptDate = (value: string) => {
  return formatDateValue(value, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }, 'Unknown time');
};

const toReadableDefinitionPreview = (value: string | null) => {
  if (!value) {
    return 'No definition preview available.';
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'No definition preview available.';
  }

  const tryExtractFromJson = (input: string) => {
    try {
      const parsed = JSON.parse(input) as unknown;
      const extracted = extractDefinitionFromDefinitions(parsed);
      return extracted || input;
    } catch {
      return input;
    }
  };

  if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
    return tryExtractFromJson(trimmedValue);
  }

  return trimmedValue;
};

function AttemptHistorySection({ attempts }: AttemptHistorySectionProps) {
  return (
    <section className="rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Attempt History</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Recent flashcard results</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-soft">
          <Sparkles size={20} className="text-brand-strong" />
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="mt-5 rounded-[22px] bg-surface-muted px-4 py-5 text-sm leading-relaxed text-text-muted">
          Your flashcard attempts will show up here after your first challenge run.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {attempts.slice(0, 6).map((attempt) => (
            <article key={attempt.id} className="rounded-[22px] bg-surface-muted px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">{attempt.lemma ?? 'Unknown word'}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        attempt.result === 'PASS'
                          ? 'bg-brand-soft text-brand-strong'
                          : 'bg-danger-soft text-danger'
                      }`}
                    >
                      {attempt.result}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                    {toReadableDefinitionPreview(attempt.definitionPreview)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-text">+{attempt.xpAwarded} XP</p>
                  <p className="mt-1 text-xs text-text-subtle">{formatAttemptDate(attempt.attemptedAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Flashcard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [lookupCards, setLookupCards] = useState<FlashcardCandidate[]>([]);
  const [attempts, setAttempts] = useState<ChallengeAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { refreshCoinGain, showXpGain } = useXpGain();
  const game = useFlashcardGame();

  useEffect(() => {
    let isMounted = true;

    const loadFlashcardPage = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [challengeList, wordLookups, attemptList] = await Promise.all([
          getChallenges(),
          getWordLookups(),
          getChallengeAttempts(),
        ]);

        if (!isMounted) {
          return;
        }

        setChallenges(challengeList);
        setLookupCards(
          wordLookups
            .map(toFlashcardCandidate)
            .filter((entry): entry is FlashcardCandidate => entry !== null),
        );
        setAttempts(attemptList);
      } catch (error) {
        console.error('Error loading flashcard page:', error);

        if (isMounted) {
          setErrorMessage('Could not load the flashcard game right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadFlashcardPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const flashcardChallenge = challenges.find((challenge) => challenge.type === 'FLASHCARD') ?? null;
  const flashcardAttempts = flashcardChallenge
    ? attempts.filter((attempt) => attempt.challengeId === flashcardChallenge.id)
    : [];
  const totalXpEarned = flashcardAttempts.reduce((sum, attempt) => sum + Math.max(0, attempt.xpAwarded), 0);
  const totalPasses = flashcardAttempts.filter((attempt) => attempt.result === 'PASS').length;
  const isLocked = lookupCards.length < MIN_LOOKUP_WORDS;
  const { advance, feedback, phase } = game;

  useEffect(() => {
    if (phase !== 'locked') return;
    const delay = feedback === 'correct' ? FEEDBACK_CORRECT_MS : FEEDBACK_WRONG_MS;
    const timer = window.setTimeout(() => {
      advance();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [advance, feedback, phase]);

  const submitAttempt = async (
    wordLookupId: number,
    result: 'PASS' | 'FAIL',
    userAnswer: string | undefined,
  ) => {
    if (!flashcardChallenge) return;
    try {
      const attempt = await createChallengeAttempt(flashcardChallenge.id, {
        result,
        userAnswer,
        wordLookupId,
      });
      setAttempts((prev) => [attempt, ...prev]);
      game.applyXp(attempt.xpAwarded);
      if (attempt.xpUpdate) {
        showXpGain({ xpUpdate: attempt.xpUpdate, source: 'challenge' });
      }
      if (attempt.result === 'PASS') {
        void refreshCoinGain('challenge').catch((error) => {
          console.error('Error refreshing coins after flashcard pass:', error);
        });
      }
    } catch (error) {
      console.error('Error submitting challenge attempt:', error);
      setSubmissionError(
        error instanceof Error ? error.message : 'Could not save this challenge attempt.',
      );
    }
  };

  const handlePick = (optionIndex: number) => {
    if (!flashcardChallenge || !game.currentCard || game.phase !== 'question') {
      return;
    }
    setSubmissionError(null);
    const pickedOption = game.currentCard.options[optionIndex];
    const { correct } = game.pick(optionIndex);
    void submitAttempt(
      game.currentCard.card.wordLookupId,
      correct ? 'PASS' : 'FAIL',
      pickedOption?.text,
    );
  };

  const handleTimeout = () => {
    if (!flashcardChallenge || !game.currentCard || game.phase !== 'question') {
      return;
    }
    setSubmissionError(null);
    const wordLookupId = game.currentCard.card.wordLookupId;
    game.timeout();
    void submitAttempt(wordLookupId, 'FAIL', undefined);
  };

  const handleStartSession = () => {
    if (!flashcardChallenge || isLocked) return;
    const deck = buildDeck(lookupCards, DECK_SIZE);
    if (deck.length === 0) return;
    setSubmissionError(null);
    game.start(deck);
  };

  const handleEndSession = () => {
    game.reset();
  };

  const isMenu = game.phase === 'idle';
  const isPlaying = game.phase === 'question' || game.phase === 'locked';
  const isEnded = game.phase === 'ended';

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-text-muted">
          Loading the flashcard game...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-lg text-danger">{errorMessage}</p>
          <p className="mt-2 text-sm text-text-muted">Check backend connection and try again.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/challenges"
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-alt"
            >
              <ChevronLeft size={14} />
              Back to challenges
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-text">Flashcard</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              Pick the right definition from four choices before the timer runs out.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-soft shadow-[0_10px_24px_rgba(62,157,123,0.16)]">
            <Brain size={26} className="text-brand-strong" />
          </div>
        </div>

        <section className="rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-surface-muted p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Cards Ready</p>
              <p className="mt-2 text-3xl font-semibold text-text">{lookupCards.length}</p>
            </div>
            <div className="rounded-[24px] bg-brand-soft p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-strong">Total Passes</p>
              <p className="mt-2 text-3xl font-semibold text-brand-strong">{totalPasses}</p>
            </div>
            <div className="rounded-[24px] bg-accent-soft p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-accent-strong">Challenge XP</p>
              <p className="mt-2 text-3xl font-semibold text-accent-strong">{totalXpEarned}</p>
            </div>
          </div>
        </section>

        {!flashcardChallenge ? (
          <section className="mt-6 rounded-[30px] border border-border bg-surface p-6 text-center shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
            <p className="text-lg font-medium text-text">Flashcard challenge is not available yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Once the backend seeds this challenge, it will unlock automatically.
            </p>
          </section>
        ) : null}

        {flashcardChallenge && isMenu ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-surface-muted px-3 py-1.5 text-text">
                  Difficulty: {flashcardChallenge.difficulty}
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand-strong">
                  {lookupCards.length} looked-up words ready
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-[24px] bg-[linear-gradient(135deg,var(--color-surface-alt)_0%,var(--color-brand-soft)_100%)] px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-text">Multiple-choice quiz</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {DECK_SIZE} cards per round · {CARD_DURATION_MS / 1000}s per card · auto-graded
                  </p>
                </div>
                <Button onClick={handleStartSession} disabled={isLocked} className="shrink-0">
                  {isLocked ? `Look up ${MIN_LOOKUP_WORDS}+ words` : 'Start'}
                </Button>
              </div>
            </section>

            {isLocked ? (
              <section className="rounded-[28px] border border-border bg-[linear-gradient(135deg,var(--color-surface-alt)_0%,var(--color-brand-soft)_100%)] p-5 shadow-[0_14px_30px_rgba(31,41,55,0.05)]">
                <p className="text-base font-medium text-text">
                  Look up at least {MIN_LOOKUP_WORDS} words to unlock this challenge
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Your looked-up words are the deck source. Distractor options are drawn from the rest of your word history.
                </p>
              </section>
            ) : (
              <section className="rounded-[28px] border border-border bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-surface)_100%)] p-5 shadow-[0_14px_30px_rgba(31,41,55,0.05)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Ready Deck</p>
                    <p className="mt-2 text-lg font-semibold text-text">
                      {lookupCards.length} looked-up words are ready for the quiz
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-soft">
                    <ChevronRight size={20} className="text-brand-strong" />
                  </div>
                </div>
              </section>
            )}

            <AttemptHistorySection attempts={flashcardAttempts} />
          </div>
        ) : null}

        {flashcardChallenge && isPlaying && game.currentCard ? (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <span>
                  Streak: <span className="font-semibold text-text">{game.streak}</span>
                </span>
                <span>
                  Correct: <span className="font-semibold text-text">{game.correctCount}</span>
                </span>
              </div>
              <StreakChip streak={game.streak} />
            </div>

            <QuestionCard
              quizCard={game.currentCard}
              currentIndex={game.currentIndex}
              totalCards={game.totalCards}
              pickedIndex={game.pickedIndex}
              feedback={game.feedback}
              locked={game.phase === 'locked'}
              onPick={handlePick}
              onEndSession={handleEndSession}
            />

            <TimerBar
              durationMs={CARD_DURATION_MS}
              runKey={game.currentIndex}
              paused={game.phase === 'locked'}
              onExpire={handleTimeout}
            />

            {submissionError ? (
              <div className="rounded-[22px] bg-danger-soft px-4 py-4 text-sm text-danger">
                {submissionError}
              </div>
            ) : null}
          </div>
        ) : null}

        {flashcardChallenge && isEnded ? (
          <div className="mt-6 space-y-6">
            <GameOverSummary
              results={game.results}
              totalCards={game.totalCards}
              correctCount={game.correctCount}
              wrongCount={game.wrongCount}
              bestStreak={game.bestStreak}
              totalXp={game.totalXp}
              onPlayAgain={handleStartSession}
              onBackToMenu={() => game.reset()}
            />
            <AttemptHistorySection attempts={flashcardAttempts} />
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
