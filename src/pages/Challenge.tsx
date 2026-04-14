import { useEffect, useState } from 'react';
import { Brain, CheckCircle2, ChevronRight, RotateCcw, Sparkles, Swords, XCircle } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { useXpGain } from '../features/xp/XpGainProvider';
import {
  createChallengeAttempt,
  extractDefinitionFromDefinitions,
  getChallengeAttempts,
  getChallenges,
  getCodexEntries,
  type Challenge,
  type ChallengeAttempt,
  type ChallengeAttemptResult,
  type CodexEntryReadResponseDTO,
} from '../api/api';

type ViewMode = 'menu' | 'playing' | 'summary';

interface FlashcardCandidate {
  codexEntryId: number;
  lemma: string;
  definition: string;
  source: string | null;
  createdAt: string;
}

interface FlashcardSessionSummary {
  totalCards: number;
  completedCards: number;
  passCount: number;
  failCount: number;
  totalXp: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
  isLocked: boolean;
  availableCardCount: number;
  onStart: () => void;
}

interface FlashcardStageProps {
  card: FlashcardCandidate;
  currentIndex: number;
  totalCards: number;
  userAnswer: string;
  isFlipped: boolean;
  isSubmitting: boolean;
  onAnswerChange: (value: string) => void;
  onFlip: () => void;
  onGrade: (result: ChallengeAttemptResult) => void;
  onEndSession: () => void;
}

interface SessionSummaryCardProps {
  summary: FlashcardSessionSummary;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

interface AttemptHistorySectionProps {
  attempts: ChallengeAttempt[];
}

const formatAttemptDate = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown time';
  }

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatCreatedDate = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Saved recently';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
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

const toFlashcardCandidate = (entry: CodexEntryReadResponseDTO): FlashcardCandidate | null => {
  const definition = entry.specificDefinition || extractDefinitionFromDefinitions(entry.definitions);

  if (!definition) {
    return null;
  }

  return {
    codexEntryId: entry.id,
    lemma: entry.lemma,
    definition,
    source: entry.source,
    createdAt: entry.createdAt,
  };
};

const shuffleCards = (cards: FlashcardCandidate[]) => {
  const nextCards = [...cards];

  for (let index = nextCards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentValue = nextCards[index];
    nextCards[index] = nextCards[swapIndex];
    nextCards[swapIndex] = currentValue;
  }

  return nextCards;
};

function ChallengeCard({ challenge, isLocked, availableCardCount, onStart }: ChallengeCardProps) {
  return (
    <section className="rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8A94A6]">Mini Game</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#22324A]">{challenge.type}</h2>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#FFF2DD_0%,#FFE5C6_100%)] shadow-[0_10px_24px_rgba(212,146,79,0.16)]">
          <Swords size={24} className="text-[#B96A2D]" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#6A7687]">{challenge.description}</p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-[#EEF5FF] px-3 py-1.5 text-[#356A9A]">
          Difficulty: {challenge.difficulty}
        </span>
        <span className="rounded-full bg-[#EAF7F1] px-3 py-1.5 text-[#2F7D5F]">
          {availableCardCount} Codex cards ready
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-[24px] bg-[linear-gradient(135deg,#FFF7EE_0%,#F5FBF7_100%)] px-4 py-4">
        <div>
          <p className="text-sm font-medium text-[#22324A]">Codex-powered flashcards</p>
          <p className="mt-1 text-sm text-[#6A7687]">
            Reveal the definition, then self-grade with pass or fail.
          </p>
        </div>
        <Button onClick={onStart} disabled={isLocked} className="shrink-0">
          {isLocked ? 'Need Codex words' : 'Start'}
        </Button>
      </div>
    </section>
  );
}

function FlashcardStage({
  card,
  currentIndex,
  totalCards,
  userAnswer,
  isFlipped,
  isSubmitting,
  onAnswerChange,
  onFlip,
  onGrade,
  onEndSession,
}: FlashcardStageProps) {
  return (
    <section className="rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8A94A6]">Card Progress</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#22324A]">
            Card {currentIndex + 1} of {totalCards}
          </h2>
        </div>
        <button
          type="button"
          onClick={onEndSession}
          className="rounded-full bg-[#F7F9FC] px-4 py-2 text-sm font-medium text-[#52606D] transition-colors hover:bg-[#EEF2F6]"
        >
          End session
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-[linear-gradient(180deg,#FFF8F0_0%,#FFFFFF_100%)]">
        <div className="border-b border-[rgba(36,52,71,0.08)] px-5 py-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Front</p>
          <h3 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-[#22324A]">{card.lemma}</h3>
          <p className="mt-2 text-sm text-[#6A7687]">
            Saved {formatCreatedDate(card.createdAt)}
            {card.source ? ` from ${card.source}` : ''}
          </p>
        </div>

        <div className="px-5 py-5">
          <label htmlFor="challenge-answer" className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">
            Your Guess
          </label>
          <textarea
            id="challenge-answer"
            value={userAnswer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="Type what you think it means before revealing the answer..."
            className="mt-3 min-h-28 w-full rounded-[20px] border border-[rgba(36,52,71,0.10)] bg-[#F7F9FC] px-4 py-3 text-sm text-[#22324A] outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#A8E6CF]"
          />

          {isFlipped ? (
            <div className="mt-5 rounded-[22px] bg-[#F7FBF8] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#7A8B78]">Back</p>
              <p className="mt-2 text-sm leading-relaxed text-[#22324A]">{card.definition}</p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="outline" onClick={onFlip} disabled={isFlipped || isSubmitting}>
              Reveal answer
            </Button>
            <Button
              onClick={() => onGrade('PASS')}
              disabled={!isFlipped || isSubmitting}
              className="bg-[#DDF4EC] text-[#1F5F48] hover:bg-[#CDECDD]"
            >
              <CheckCircle2 size={18} className="mr-2 inline-flex" />
              {isSubmitting ? 'Saving...' : 'Pass'}
            </Button>
            <Button
              onClick={() => onGrade('FAIL')}
              disabled={!isFlipped || isSubmitting}
              className="bg-[#FFE1DE] text-[#9C3D35] hover:bg-[#FFD1CB]"
            >
              <XCircle size={18} className="mr-2 inline-flex" />
              {isSubmitting ? 'Saving...' : 'Fail'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SessionSummaryCard({ summary, onPlayAgain, onBackToMenu }: SessionSummaryCardProps) {
  return (
    <section className="rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <p className="text-xs uppercase tracking-[0.24em] text-[#8A94A6]">Session Summary</p>
      <h2 className="mt-2 text-3xl font-semibold text-[#22324A]">Flashcards complete</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">
        Your results are already saved. Backend-awarded XP is reflected below.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[22px] bg-[#F7F9FC] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8A94A6]">Cards</p>
          <p className="mt-2 text-2xl font-semibold text-[#22324A]">{summary.completedCards}/{summary.totalCards}</p>
        </div>
        <div className="rounded-[22px] bg-[#EEF8F2] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#6A8B76]">Pass</p>
          <p className="mt-2 text-2xl font-semibold text-[#1F5F48]">{summary.passCount}</p>
        </div>
        <div className="rounded-[22px] bg-[#FFF1EF] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#A36A62]">Fail</p>
          <p className="mt-2 text-2xl font-semibold text-[#9C3D35]">{summary.failCount}</p>
        </div>
        <div className="rounded-[22px] bg-[#FFF7E8] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#9D7A34]">XP Earned</p>
          <p className="mt-2 text-2xl font-semibold text-[#8C6420]">{summary.totalXp}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onPlayAgain}>
          <RotateCcw size={18} className="mr-2 inline-flex" />
          Play again
        </Button>
        <Button variant="outline" onClick={onBackToMenu}>
          Back to menu
        </Button>
      </div>
    </section>
  );
}

function AttemptHistorySection({ attempts }: AttemptHistorySectionProps) {
  return (
    <section className="rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/90 p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8A94A6]">Attempt History</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#22324A]">Recent flashcard results</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#EEF6FF]">
          <Sparkles size={20} className="text-[#4676B8]" />
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="mt-5 rounded-[22px] bg-[#F7F9FC] px-4 py-5 text-sm leading-relaxed text-[#6A7687]">
          Your flashcard attempts will show up here after your first challenge run.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {attempts.slice(0, 6).map((attempt) => (
            <article key={attempt.id} className="rounded-[22px] bg-[#F7F9FC] px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#22324A]">{attempt.lemma ?? 'Unknown word'}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        attempt.result === 'PASS'
                          ? 'bg-[#E3F6EC] text-[#2F7D5F]'
                          : 'bg-[#FFE4E0] text-[#A14B43]'
                      }`}
                    >
                      {attempt.result}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#6A7687]">
                    {toReadableDefinitionPreview(attempt.definitionPreview)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[#22324A]">+{attempt.xpAwarded} XP</p>
                  <p className="mt-1 text-xs text-[#8A94A6]">{formatAttemptDate(attempt.attemptedAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Challenge() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [codexCards, setCodexCards] = useState<FlashcardCandidate[]>([]);
  const [attempts, setAttempts] = useState<ChallengeAttempt[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [activeDeck, setActiveDeck] = useState<FlashcardCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<FlashcardSessionSummary | null>(null);
  const { showXpGain } = useXpGain();

  useEffect(() => {
    let isMounted = true;

    const loadChallengePage = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [challengeList, codexEntries, attemptList] = await Promise.all([
          getChallenges(),
          getCodexEntries(),
          getChallengeAttempts(),
        ]);

        if (!isMounted) {
          return;
        }

        setChallenges(challengeList);
        setCodexCards(codexEntries.map(toFlashcardCandidate).filter((entry): entry is FlashcardCandidate => entry !== null));
        setAttempts(attemptList);
      } catch (error) {
        console.error('Error loading challenges page:', error);

        if (isMounted) {
          setErrorMessage('Could not load your challenges right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadChallengePage();

    return () => {
      isMounted = false;
    };
  }, []);

  const flashcardChallenge = challenges.find((challenge) => challenge.type === 'FLASHCARD') ?? null;
  const flashcardAttempts = flashcardChallenge
    ? attempts.filter((attempt) => attempt.challengeId === flashcardChallenge.id)
    : [];
  const currentCard = activeDeck[currentIndex] ?? null;
  const totalXpEarned = flashcardAttempts.reduce((sum, attempt) => sum + Math.max(0, attempt.xpAwarded), 0);
  const totalPasses = flashcardAttempts.filter((attempt) => attempt.result === 'PASS').length;

  const resetSession = () => {
    setActiveDeck([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserAnswer('');
    setIsSubmitting(false);
    setSubmissionError(null);
  };

  const startFlashcardSession = () => {
    if (!flashcardChallenge || codexCards.length === 0) {
      return;
    }

    const nextDeck = shuffleCards(codexCards);

    resetSession();
    setSessionSummary(null);
    setActiveDeck(nextDeck);
    setViewMode('playing');
  };

  const finishSession = (summary: FlashcardSessionSummary) => {
    setSessionSummary(summary);
    setViewMode('summary');
    setActiveDeck([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserAnswer('');
    setSubmissionError(null);
    setIsSubmitting(false);
  };

  const handleGradeCard = async (result: ChallengeAttemptResult) => {
    if (!flashcardChallenge || !currentCard || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const createdAttempt = await createChallengeAttempt(flashcardChallenge.id, {
        result,
        userAnswer: userAnswer.trim() || undefined,
        codexEntryId: currentCard.codexEntryId,
      });

      setAttempts((previousAttempts) => [createdAttempt, ...previousAttempts]);

      if (createdAttempt.xpUpdate) {
        showXpGain({
          xpUpdate: createdAttempt.xpUpdate,
          source: 'challenge',
        });
      }

      const isFinalCard = currentIndex >= activeDeck.length - 1;

      if (isFinalCard) {
        const nextSummary = {
          totalCards: activeDeck.length,
          completedCards: activeDeck.length,
          passCount: sessionSummary?.passCount ?? 0,
          failCount: sessionSummary?.failCount ?? 0,
          totalXp: sessionSummary?.totalXp ?? 0,
        };

        if (result === 'PASS') {
          nextSummary.passCount += 1;
        } else {
          nextSummary.failCount += 1;
        }

        nextSummary.totalXp += createdAttempt.xpAwarded;
        finishSession(nextSummary);
        return;
      }

      setSessionSummary((previousSummary) => {
        const baseSummary = previousSummary ?? {
          totalCards: activeDeck.length,
          completedCards: 0,
          passCount: 0,
          failCount: 0,
          totalXp: 0,
        };

        return {
          ...baseSummary,
          completedCards: baseSummary.completedCards + 1,
          passCount: baseSummary.passCount + (result === 'PASS' ? 1 : 0),
          failCount: baseSummary.failCount + (result === 'FAIL' ? 1 : 0),
          totalXp: baseSummary.totalXp + createdAttempt.xpAwarded,
        };
      });
      setCurrentIndex((previousIndex) => previousIndex + 1);
      setIsFlipped(false);
      setUserAnswer('');
    } catch (error) {
      console.error('Error submitting challenge attempt:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Could not save this challenge attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSession = () => {
    const completedCards = Math.min(currentIndex, activeDeck.length);
    const totalCards = activeDeck.length;

    finishSession(sessionSummary ?? {
      totalCards,
      completedCards,
      passCount: 0,
      failCount: 0,
      totalXp: 0,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_55%,#FFF9EF_100%)] pb-24">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-[#6A7687]">
          Loading your challenge menu...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_55%,#FFF9EF_100%)] pb-24">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-lg text-[#FF6B6B]">{errorMessage}</p>
          <p className="mt-2 text-sm text-[#6A7687]">Check backend connection and try again.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_45%,#FFF8EE_100%)] pb-24">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[#22324A]">Challenges</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6A7687]">
              Pick a mini game, train your memory, and let the backend track your earned XP.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#DFF5EA_0%,#CDEDDD_100%)] shadow-[0_10px_24px_rgba(62,157,123,0.16)]">
            <Brain size={26} className="text-[#2F7D5F]" />
          </div>
        </div>

        <section className="rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-[#F7F9FC] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8A94A6]">Mini Games</p>
              <p className="mt-2 text-3xl font-semibold text-[#22324A]">{challenges.length}</p>
            </div>
            <div className="rounded-[24px] bg-[#EEF8F2] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#6A8B76]">Total Passes</p>
              <p className="mt-2 text-3xl font-semibold text-[#1F5F48]">{totalPasses}</p>
            </div>
            <div className="rounded-[24px] bg-[#FFF6E6] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#9D7A34]">Challenge XP</p>
              <p className="mt-2 text-3xl font-semibold text-[#8C6420]">{totalXpEarned}</p>
            </div>
          </div>
        </section>

        {!flashcardChallenge ? (
          <section className="mt-6 rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-6 text-center shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
            <p className="text-lg font-medium text-[#22324A]">No challenge types are available yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">
              Once the backend seeds the first challenge, it will show up here automatically.
            </p>
          </section>
        ) : null}

        {flashcardChallenge && viewMode === 'menu' ? (
          <div className="mt-6 space-y-6">
            <ChallengeCard
              challenge={flashcardChallenge}
              isLocked={codexCards.length === 0}
              availableCardCount={codexCards.length}
              onStart={startFlashcardSession}
            />

            {codexCards.length === 0 ? (
              <section className="rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-[linear-gradient(135deg,#FFF7EC_0%,#F1FBF6_100%)] p-5 shadow-[0_14px_30px_rgba(31,41,55,0.05)]">
                <p className="text-base font-medium text-[#22324A]">Your Codex is the first deck source</p>
                <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">
                  Save words in Codex first, then this flashcard challenge can turn them into your practice deck.
                </p>
              </section>
            ) : (
              <section className="rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-[linear-gradient(135deg,#EEF6FF_0%,#FFFFFF_100%)] p-5 shadow-[0_14px_30px_rgba(31,41,55,0.05)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#7E8CA0]">Ready Deck</p>
                    <p className="mt-2 text-lg font-semibold text-[#22324A]">
                      {codexCards.length} saved words are ready for flashcards
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#DCEEFF]">
                    <ChevronRight size={20} className="text-[#4676B8]" />
                  </div>
                </div>
              </section>
            )}

            <AttemptHistorySection attempts={flashcardAttempts} />
          </div>
        ) : null}

        {flashcardChallenge && viewMode === 'playing' && currentCard ? (
          <div className="mt-6 space-y-5">
            <FlashcardStage
              card={currentCard}
              currentIndex={currentIndex}
              totalCards={activeDeck.length}
              userAnswer={userAnswer}
              isFlipped={isFlipped}
              isSubmitting={isSubmitting}
              onAnswerChange={setUserAnswer}
              onFlip={() => setIsFlipped(true)}
              onGrade={handleGradeCard}
              onEndSession={handleEndSession}
            />

            {submissionError ? (
              <div className="rounded-[22px] bg-[#FFE8E4] px-4 py-4 text-sm text-[#9C3D35]">
                {submissionError}
              </div>
            ) : null}
          </div>
        ) : null}

        {flashcardChallenge && viewMode === 'summary' && sessionSummary ? (
          <div className="mt-6 space-y-6">
            <SessionSummaryCard
              summary={sessionSummary}
              onPlayAgain={startFlashcardSession}
              onBackToMenu={() => {
                resetSession();
                setSessionSummary(null);
                setViewMode('menu');
              }}
            />
            <AttemptHistorySection attempts={flashcardAttempts} />
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
