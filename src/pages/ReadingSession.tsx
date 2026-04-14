import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Pause, Play, Search, Square } from 'lucide-react';
import { Button } from '../components/Button';
import { WordLookupModal } from '../components/WordLookupModal';
import { useXpGain } from '../features/xp/XpGainProvider';
import { createSession, getBook, updateSession, type ApiBook, type RarityTier, type XpUpdateResponseDTO } from '../api/api';

interface SessionCodexEntry {
  lemma: string;
  definition: string;
  synonyms: string[];
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function ReadingSession() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<ApiBook | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showWordLookupModal, setShowWordLookupModal] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [codexEntries, setCodexEntries] = useState<SessionCodexEntry[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const { showXpGain } = useXpGain();
  const intervalRef = useRef<number | null>(null);
  const shouldResumeAfterLookupRef = useRef(false);
  const sessionInitializationRef = useRef<Promise<number> | null>(null);

  const ensureSessionInitialized = useCallback(async (parsedBookId: number) => {
    if (activeSessionId) {
      return activeSessionId;
    }

    if (!sessionInitializationRef.current) {
      sessionInitializationRef.current = createSession({
        bookId: parsedBookId,
        durationSeconds: 0,
        startPage: 0,
        endPage: 0,
        reflection: '',
      }).then((createdSession) => {
        setActiveSessionId(createdSession.id);
        return createdSession.id;
      }).catch((error) => {
        sessionInitializationRef.current = null;
        throw error;
      });
    }

    return sessionInitializationRef.current;
  }, [activeSessionId]);

  useEffect(() => {
    let isMounted = true;

    const loadSessionContext = async () => {
      if (!bookId) {
        navigate('/library');
        return;
      }

      const parsedBookId = Number(bookId);

      if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
        navigate('/library');
        return;
      }

      try {
        setIsLoadingBook(true);
        setSessionError(null);
        const [loadedBook] = await Promise.all([
          getBook(parsedBookId),
          ensureSessionInitialized(parsedBookId),
        ]);

        if (isMounted) {
          setBook(loadedBook);
        }
      } catch (error) {
        console.error('Error loading reading session:', error);

        if (isMounted) {
          setSessionError('Could not start this reading session right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingBook(false);
        }
      }
    };

    void loadSessionContext();

    return () => {
      isMounted = false;
    };
  }, [bookId, ensureSessionInitialized, navigate]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((currentSeconds) => currentSeconds + 1);
      }, 1000);
    } else if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (showWordLookupModal) {
      shouldResumeAfterLookupRef.current = true;
      setIsRunning(false);
      return;
    }

    if (shouldResumeAfterLookupRef.current && !showReflectionModal) {
      setIsRunning(true);
      shouldResumeAfterLookupRef.current = false;
    }
  }, [isRunning, showReflectionModal, showWordLookupModal]);

  const handleStopSession = () => {
    setIsRunning(false);
    setShowReflectionModal(true);
  };

  const handleSaveSession = async (reflection: string, startPage: number, endPage: number) => {
    if (!bookId) {
      throw new Error('Missing book id');
    }

    const parsedBookId = Number(bookId);

    if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
      throw new Error('Invalid book id');
    }

    if (seconds <= 0) {
      throw new Error('Session duration must be greater than 0');
    }

    if (!Number.isInteger(startPage) || startPage < 0) {
      throw new Error('Start page must be zero or greater');
    }

    if (!Number.isInteger(endPage) || endPage < 0) {
      throw new Error('End page must be zero or greater');
    }

    const trimmedReflection = reflection.trim();

    if (trimmedReflection.length > 2000) {
      throw new Error('Reflection must be 2000 characters or fewer');
    }

    const sessionId = await ensureSessionInitialized(parsedBookId);

    const updatedSession = await updateSession(sessionId, {
      durationSeconds: seconds,
      endPage,
      reflection: trimmedReflection,
      status: 'COMPLETED',
    });

    if (updatedSession.xpUpdate) {
      showXpGain({
        xpUpdate: updatedSession.xpUpdate,
        source: 'session',
      });
    }

    navigate(`/book/${bookId}`);
  };

  const handleCaptureWord = (captureResult: SessionCodexEntry & { newCapture: boolean; xpValue: number; xpUpdate: XpUpdateResponseDTO | null; rarityTier: RarityTier }) => {
    if (!captureResult.newCapture) {
      return;
    }

    setCodexEntries((previousEntries) => {
      if (previousEntries.some((word) => word.lemma.toLowerCase() === captureResult.lemma.toLowerCase())) {
        return previousEntries;
      }

      return [...previousEntries, {
        lemma: captureResult.lemma,
        definition: captureResult.definition,
        synonyms: captureResult.synonyms,
      }];
    });

    if (captureResult.xpUpdate) {
      showXpGain({
        xpUpdate: captureResult.xpUpdate,
        source: 'capture',
        rarityTier: captureResult.rarityTier,
      });
    }
  };

  const handleToggleTimer = () => {
    setIsRunning((currentValue) => !currentValue);
  };

  if (isLoadingBook) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_58%,#F8F5FF_100%)] pb-24">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-5 text-[#6A7687]">
          Preparing your reading session...
        </div>
      </div>
    );
  }

  if (sessionError || !book) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_58%,#F8F5FF_100%)] pb-24">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-5">
          <div className="text-center">
            <p className="text-lg text-[#FF6B6B]">{sessionError ?? 'Session not found.'}</p>
            <button
              onClick={() => navigate('/library')}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-[#A8E6CF] px-5 text-sm font-medium text-[#22324A]"
            >
              Back to library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_58%,#F8F5FF_100%)] px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(36,52,71,0.08)] bg-white/90 text-[#22324A] shadow-[0_10px_20px_rgba(31,41,55,0.05)] transition-colors hover:bg-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Reading Session</p>
            <h1 className="truncate text-2xl font-semibold text-[#22324A]">{book.title}</h1>
            <p className="mt-1 truncate text-sm text-[#6A7687]">{book.author}</p>
          </div>
        </div>

        <section className="mt-5 rounded-[32px] border border-[rgba(36,52,71,0.08)] bg-white/92 px-6 py-8 text-center shadow-[0_18px_38px_rgba(31,41,55,0.07)]">
          <p className="text-sm text-[#6A7687]">Focus timer</p>
          <div
            className={`mt-4 text-6xl font-semibold tabular-nums tracking-[-0.05em] text-[#22324A] transition-all duration-300 sm:text-7xl ${
              isRunning ? 'scale-[1.01]' : ''
            }`}
          >
            {formatTime(seconds)}
          </div>
          <p className="mt-3 text-sm text-[#6A7687]">{isRunning ? 'Reading in progress' : seconds === 0 ? 'Ready when you are' : 'Timer paused'}</p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {seconds === 0 ? (
              <Button
                className="h-12 rounded-full px-8 shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
                onClick={handleToggleTimer}
              >
                <span className="inline-flex items-center gap-2">
                  <Play size={18} />
                  Start
                </span>
              </Button>
            ) : (
              <>
                <Button
                  className="h-12 rounded-full px-8 shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
                  onClick={handleToggleTimer}
                >
                  <span className="inline-flex items-center gap-2">
                    {isRunning ? <Pause size={18} /> : <Play size={18} />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-[#F2B9AE] bg-white text-[#B75B50] hover:bg-[#FFF6F4]"
                  onClick={handleStopSession}
                >
                  <span className="inline-flex items-center gap-2">
                    <Square size={18} />
                    Stop
                  </span>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setShowWordLookupModal(true)}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#EFF4FF] px-5 text-sm font-medium text-[#375B87] transition-colors hover:bg-[#E5EEFF]"
          >
            <Search size={16} />
            Look up Word
          </button>
        </section>

        <section className="mt-6 rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-white/90 p-5 shadow-[0_14px_30px_rgba(31,41,55,0.06)]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Captured Words</p>
            <p className="mt-2 text-sm text-[#6A7687]">
              {codexEntries.length === 0 ? 'No words captured yet' : `${codexEntries.length} words captured this session`}
            </p>
          </div>

          {codexEntries.length === 0 ? (
            <div className="mt-4 rounded-[22px] bg-[#F7F9FC] px-4 py-5 text-sm leading-relaxed text-[#6A7687]">
              Pause for interesting vocabulary as you read, and your captured words will show up here.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {codexEntries.map((entry) => (
                <div
                  key={entry.lemma}
                  className="rounded-full border border-[rgba(138,97,215,0.14)] bg-[#F3EDFF] px-3 py-1.5 text-sm font-medium text-[#6E53B5]"
                >
                  {entry.lemma}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <WordLookupModal
        isOpen={showWordLookupModal}
        onClose={() => setShowWordLookupModal(false)}
        codexEntryLemmas={codexEntries.map((codexEntry) => codexEntry.lemma)}
        sessionId={activeSessionId}
        onCapture={handleCaptureWord}
      />

      {showReflectionModal ? (
        <ReflectionModal
          durationSeconds={seconds}
          book={book}
          wordsCount={codexEntries.length}
          onClose={() => setShowReflectionModal(false)}
          onSubmit={handleSaveSession}
        />
      ) : null}
    </div>
  );
}

interface ReflectionModalProps {
  durationSeconds: number;
  book: ApiBook;
  wordsCount: number;
  onClose: () => void;
  onSubmit: (reflection: string, startPage: number, endPage: number) => Promise<void>;
}

function ReflectionModal({
  durationSeconds,
  book,
  wordsCount,
  onClose,
  onSubmit,
}: ReflectionModalProps) {
  const [reflection, setReflection] = useState('');
  const [startPage, setStartPage] = useState(String(book.readPages));
  const [endPage, setEndPage] = useState(String(book.readPages));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmedReflectionLength = reflection.trim().length;
  const isValidReflection = trimmedReflectionLength >= 50 && trimmedReflectionLength <= 2000;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const parsedStartPage = Number(startPage);
    const parsedEndPage = Number(endPage);
    const trimmedReflection = reflection.trim();

    if (!Number.isInteger(parsedStartPage) || !Number.isInteger(parsedEndPage)) {
      setSubmitError('Enter valid whole numbers for start and end page.');
      return;
    }

    if (parsedStartPage < 0 || parsedEndPage < 0) {
      setSubmitError('Start page and end page must be zero or greater.');
      return;
    }

    if (parsedEndPage < parsedStartPage) {
      setSubmitError('End page must be greater than or equal to start page.');
      return;
    }

    if (trimmedReflection.length < 50) {
      setSubmitError('Reflection must be at least 50 characters.');
      return;
    }

    if (trimmedReflection.length > 2000) {
      setSubmitError('Reflection must be 2000 characters or fewer.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSubmit(trimmedReflection, parsedStartPage, parsedEndPage);
    } catch (error) {
      console.error('Error saving session:', error);
      setSubmitError('Could not save session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_48px_rgba(17,24,39,0.18)]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DFF5EA]">
            <BookOpen size={28} className="text-[#3D9B7A]" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[#22324A]">Session Complete</h2>
          <p className="mt-2 text-sm text-[#6A7687]">
            {formatTime(durationSeconds)} • {wordsCount} words captured
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="rounded-[24px] bg-[#F7F9FC] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Book</p>
            <p className="mt-2 text-base font-semibold text-[#22324A]">{book.title}</p>
            <p className="mt-1 text-sm text-[#6A7687]">{book.author}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#22324A]">Start Page</label>
              <input
                type="number"
                value={startPage}
                onChange={(event) => setStartPage(event.target.value)}
                className="w-full rounded-[16px] border border-[rgba(36,52,71,0.08)] bg-[#F7F9FC] px-4 py-3 text-[#22324A] outline-none transition-all focus:border-[#A8E6CF] focus:bg-white focus:ring-2 focus:ring-[#CFEFDF]"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#22324A]">End Page</label>
              <input
                type="number"
                value={endPage}
                onChange={(event) => setEndPage(event.target.value)}
                className="w-full rounded-[16px] border border-[rgba(36,52,71,0.08)] bg-[#F7F9FC] px-4 py-3 text-[#22324A] outline-none transition-all focus:border-[#A8E6CF] focus:bg-white focus:ring-2 focus:ring-[#CFEFDF]"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#22324A]">Reflection</label>
            <textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What stood out in this session? What did you notice, learn, or enjoy?"
              className="min-h-[140px] w-full resize-none rounded-[18px] border border-[rgba(36,52,71,0.08)] bg-[#F7F9FC] px-4 py-3 text-[#22324A] outline-none transition-all focus:border-[#A8E6CF] focus:bg-white focus:ring-2 focus:ring-[#CFEFDF]"
            />
            <p className={`mt-2 text-xs ${isValidReflection ? 'text-[#3D9B7A]' : 'text-[#6A7687]'}`}>
              {trimmedReflectionLength}/50 characters minimum
            </p>
          </div>

          {submitError ? <p className="text-sm text-[#FF6B6B]">{submitError}</p> : null}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
              disabled={!isValidReflection || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
