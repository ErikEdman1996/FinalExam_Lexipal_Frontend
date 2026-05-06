import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ChevronDown, Pause, Play, Search, Square, X } from 'lucide-react';
import { BookCover } from '../components/BookCover';
import { Button } from '../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
  inputClassName,
  textareaClassName,
} from '../components/form/inputStyles';
import { NoteModal } from '../components/NoteModal';
import { WordLookupDetailsDialog } from '../components/WordLookupDetailsDialog';
import { WordLookupModal } from '../components/WordLookupModal';
import { useBooks } from '../features/books/useBooks';
import { ReadingMusicPlayer } from '../features/music/ReadingMusicPlayer';
import { useNoteTags } from '../features/noteTags';
import { useXpGain } from '../features/xp/useXpGain';
import {
  completeSession,
  createNote,
  createSession,
  extractPhoneticText,
  getActiveSessionByBook,
  getBook,
  updateSession,
  type ApiBook,
  type ApiSession,
  type RarityTier,
  type UpdateSessionPayload,
  type WordLookupReadResponseDTO,
  type XpUpdateResponseDTO,
} from '../api/api';

const AUTOSAVE_INTERVAL_SECONDS = 15;
const RECENT_WORD_LOOKUPS_STORAGE_PREFIX = 'lexipal:reading-session-recent-word-lookups:';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object';
};

const isStoredWordLookup = (value: unknown): value is WordLookupReadResponseDTO => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number'
    && typeof value.wordId === 'number'
    && typeof value.lemma === 'string'
    && typeof value.firstLookedUpAt === 'string'
    && typeof value.lastLookedUpAt === 'string'
    && typeof value.lookupCount === 'number'
  );
};

const getRecentWordLookupsStorageKey = (bookId: string | undefined) => {
  return bookId ? `${RECENT_WORD_LOOKUPS_STORAGE_PREFIX}${bookId}` : null;
};

const loadStoredRecentWordLookups = (storageKey: string | null): WordLookupReadResponseDTO[] => {
  if (!storageKey || typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isStoredWordLookup) : [];
  } catch (error) {
    console.error('Error loading recent word lookups:', error);
    return [];
  }
};

const saveStoredRecentWordLookups = (
  storageKey: string | null,
  lookups: WordLookupReadResponseDTO[],
) => {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }

  try {
    if (lookups.length === 0) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(lookups));
  } catch (error) {
    console.error('Error saving recent word lookups:', error);
  }
};

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

export default function ReadingSession() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const recentWordLookupsStorageKey = getRecentWordLookupsStorageKey(bookId);
  const [book, setBook] = useState<ApiBook | null>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showWordLookupModal, setShowWordLookupModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isPreparingLookup, setIsPreparingLookup] = useState(false);
  const [noteToastMessage, setNoteToastMessage] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLookedUpWordsExpanded, setIsLookedUpWordsExpanded] = useState(false);
  const [recentWordLookups, setRecentWordLookups] = useState<WordLookupReadResponseDTO[]>(
    () => loadStoredRecentWordLookups(recentWordLookupsStorageKey),
  );
  const [selectedLookup, setSelectedLookup] = useState<WordLookupReadResponseDTO | null>(null);
  const [activeSession, setActiveSession] = useState<ApiSession | null>(null);
  const { refreshBooks, refreshLibraryItems } = useBooks();
  const noteTags = useNoteTags();
  const { showXpGain } = useXpGain();
  const intervalRef = useRef<number | null>(null);
  const shouldResumeAfterActionModalRef = useRef(false);
  const sessionInitializationRef = useRef<Promise<ApiSession> | null>(null);
  const activeSessionRef = useRef<ApiSession | null>(null);
  const secondsRef = useRef(0);
  const wasRunningRef = useRef(false);
  const lastAutosavedSecondRef = useRef(0);
  const noteToastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    saveStoredRecentWordLookups(recentWordLookupsStorageKey, recentWordLookups);
  }, [recentWordLookups, recentWordLookupsStorageKey]);

  const ensureSessionInitialized = useCallback(async (parsedBookId: number) => {
    if (activeSessionRef.current) {
      return activeSessionRef.current;
    }

    if (!sessionInitializationRef.current) {
      sessionInitializationRef.current = (async () => {
        try {
          const createdSession = await createSession({
            bookId: parsedBookId,
            startPage: Math.max(0, book?.readPages ?? 0),
          });
          activeSessionRef.current = createdSession;
          setActiveSession(createdSession);
          return createdSession;
        } catch (error) {
          const message = error instanceof Error ? error.message : '';

          if (message.includes('You already have an active session for this book.')) {
            const existingSession = await getActiveSessionByBook(parsedBookId);

            if (existingSession) {
              activeSessionRef.current = existingSession;
              setActiveSession(existingSession);
              setSeconds((currentSeconds) => Math.max(currentSeconds, existingSession.durationSeconds));
              return existingSession;
            }
          }

          throw error;
        } finally {
          sessionInitializationRef.current = null;
        }
      })();
    }

    return sessionInitializationRef.current;
  }, [book?.readPages]);

  const persistDraftSession = useCallback(async (overrides: UpdateSessionPayload = {}) => {
    const currentSession = activeSessionRef.current;

    if (!currentSession || currentSession.status === 'COMPLETED') {
      return null;
    }

    try {
      const updatedSession = await updateSession(currentSession.id, {
        durationSeconds: overrides.durationSeconds ?? secondsRef.current,
        endPage: overrides.endPage ?? Math.max(currentSession.endPage, currentSession.startPage),
        reflection: overrides.reflection ?? currentSession.reflection,
      });

      activeSessionRef.current = updatedSession;
      setActiveSession(updatedSession);
      return updatedSession;
    } catch (error) {
      console.error('Error autosaving reading session:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSessionContext = async () => {
      if (!bookId) {
        void navigate('/library');
        return;
      }

      const parsedBookId = Number(bookId);

      if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
        void navigate('/library');
        return;
      }

      try {
        setIsLoadingBook(true);
        setLoadError(null);
        setActionError(null);

        const [loadedBook, activeDraft] = await Promise.all([
          getBook(parsedBookId),
          getActiveSessionByBook(parsedBookId),
        ]);

        if (!isMounted) {
          return;
        }

        setBook(loadedBook);
        setActiveSession(activeDraft);
        setSeconds(activeDraft?.durationSeconds ?? 0);
      } catch (error) {
        console.error('Error loading reading session:', error);

        if (isMounted) {
          setLoadError('Could not prepare this reading session right now.');
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
  }, [bookId, navigate]);

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
    if (showWordLookupModal || showNoteModal) {
      shouldResumeAfterActionModalRef.current = isRunning;
      setIsRunning(false);
      return;
    }

    if (shouldResumeAfterActionModalRef.current && !showReflectionModal) {
      setIsRunning(true);
      shouldResumeAfterActionModalRef.current = false;
    }
  }, [isRunning, showNoteModal, showReflectionModal, showWordLookupModal]);

  useEffect(() => {
    return () => {
      if (noteToastTimeoutRef.current != null) {
        window.clearTimeout(noteToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeSession || !isRunning || seconds <= 0) {
      return;
    }

    if (seconds % AUTOSAVE_INTERVAL_SECONDS !== 0 || lastAutosavedSecondRef.current === seconds) {
      return;
    }

    lastAutosavedSecondRef.current = seconds;
    void persistDraftSession();
  }, [activeSession, isRunning, persistDraftSession, seconds]);

  useEffect(() => {
    if (wasRunningRef.current && !isRunning && activeSession && seconds > 0) {
      void persistDraftSession();
    }

    wasRunningRef.current = isRunning;
  }, [activeSession, isRunning, persistDraftSession, seconds]);

  const handleStopSession = () => {
    setIsRunning(false);
    setShowReflectionModal(true);
  };

  const handleSaveSession = async (reflection: string, endPage: number) => {
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

    const session = await ensureSessionInitialized(parsedBookId);
    const trimmedReflection = reflection.trim();

    if (endPage < session.startPage) {
      throw new Error('End page must be greater than or equal to start page.');
    }

    if (!trimmedReflection) {
      throw new Error('Reflection is required.');
    }

    if (trimmedReflection.length > 2000) {
      throw new Error('Reflection must be 2000 characters or fewer');
    }

    const completedSession = await completeSession(session.id, {
      durationSeconds: seconds,
      endPage,
      reflection: trimmedReflection,
    });

    if (completedSession.xpUpdate) {
      showXpGain({
        xpUpdate: completedSession.xpUpdate,
        source: 'session',
      });
    }

    activeSessionRef.current = null;
    setActiveSession(null);
    saveStoredRecentWordLookups(recentWordLookupsStorageKey, []);
    void refreshBooks({ silent: true }).catch((error) => {
      console.error('Error refreshing books after session completion:', error);
    });
    void refreshLibraryItems({ silent: true }).catch((error) => {
      console.error('Error refreshing library items after session completion:', error);
    });
    void navigate(`/book/${bookId}`);
  };

  const handleCaptureWord = (captureResult: {
    isCollectible: boolean;
    isNewCapture: boolean;
    xpUpdate: XpUpdateResponseDTO | null;
    rarityTier: RarityTier;
  }) => {
    if (!captureResult.isCollectible || !captureResult.isNewCapture) {
      return;
    }

    if (captureResult.xpUpdate) {
      showXpGain({
        xpUpdate: captureResult.xpUpdate,
        source: 'capture',
        rarityTier: captureResult.rarityTier,
      });
    }
  };

  const handleLookupSaved = useCallback((lookup: WordLookupReadResponseDTO) => {
    setRecentWordLookups((previousLookups) => [
      lookup,
      ...previousLookups.filter((previousLookup) => previousLookup.id !== lookup.id),
    ]);

    setSelectedLookup((currentLookup) => (currentLookup?.id === lookup.id ? lookup : currentLookup));
  }, []);

  const showNoteSavedToast = useCallback(() => {
    if (noteToastTimeoutRef.current != null) {
      window.clearTimeout(noteToastTimeoutRef.current);
    }

    setNoteToastMessage('Note saved');
    noteToastTimeoutRef.current = window.setTimeout(() => {
      setNoteToastMessage(null);
      noteToastTimeoutRef.current = null;
    }, 2400);
  }, []);

  const handleSaveNote = async ({
    quotedText,
    pageNumber,
    chapterLabel,
    tagIds,
  }: {
    quotedText: string;
    pageNumber: number;
    chapterLabel?: string;
    tagIds?: number[];
  }) => {
    if (!book || !activeSession) {
      throw new Error('Reading session is not ready yet.');
    }

    await createNote({
      bookId: book.id,
      sessionId: activeSession.id,
      quotedText,
      pageNumber,
      chapterLabel,
      ...(tagIds && tagIds.length > 0 ? { tagIds } : {}),
    });

    setShowNoteModal(false);
    showNoteSavedToast();
  };

  const handleToggleTimer = async () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    if (!bookId) {
      setActionError('Missing book id.');
      return;
    }

    const parsedBookId = Number(bookId);

    if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
      setActionError('Invalid book id.');
      return;
    }

    try {
      setActionError(null);
      await ensureSessionInitialized(parsedBookId);
      setIsRunning(true);
    } catch (error) {
      console.error('Error starting reading session:', error);
      setActionError(getErrorMessage(error, 'Could not start this reading session right now.'));
    }
  };

  const handleOpenWordLookup = async () => {
    if (activeSessionRef.current) {
      setShowWordLookupModal(true);
      return;
    }

    if (!bookId) {
      setActionError('Missing book id.');
      return;
    }

    const parsedBookId = Number(bookId);

    if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
      setActionError('Invalid book id.');
      return;
    }

    try {
      setIsPreparingLookup(true);
      setActionError(null);
      await ensureSessionInitialized(parsedBookId);
      setShowWordLookupModal(true);
    } catch (error) {
      console.error('Error preparing word lookup:', error);
      setActionError(getErrorMessage(error, 'Could not prepare word lookup right now.'));
    } finally {
      setIsPreparingLookup(false);
    }
  };

  const draftStartPage = activeSession?.startPage ?? Math.max(0, book?.readPages ?? 0);
  const draftEndPage = activeSession
    ? Math.max(activeSession.endPage, activeSession.startPage)
    : Math.max(0, book?.readPages ?? 0);
  const draftReflection = activeSession?.reflection ?? '';
  const noteDefaultPage = activeSession
    ? Math.max(activeSession.endPage, activeSession.startPage)
    : null;
  const noteInitialPage = noteDefaultPage != null && noteDefaultPage > 0 ? noteDefaultPage : null;

  if (isLoadingBook) {
    return (
      <div className="page-bg min-h-screen pb-24">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-5 text-text-muted">
          Preparing your reading session...
        </div>
      </div>
    );
  }

  if (loadError || !book) {
    return (
      <div className="page-bg min-h-screen pb-24">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-5">
          <div className="text-center">
            <p className="text-lg text-danger">{loadError ?? 'Session not found.'}</p>
            <button
              onClick={() => {
                void navigate('/library');
              }}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-medium text-text-on-brand"
            >
              Back to library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              void navigate(-1);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text shadow-[0_10px_20px_rgba(31,41,55,0.05)] transition-colors hover:bg-surface-alt"
          >
            <ArrowLeft size={20} />
          </button>
          <BookCover
            title={book.title}
            author={book.author}
            coverImageUrl={book.coverImageUrl}
            size="xs"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Reading Session</p>
            <h1 className="truncate text-2xl font-semibold text-text">{book.title}</h1>
            <p className="mt-1 truncate text-sm text-text-muted">{book.author}</p>
          </div>
        </div>

        <section className="mt-5 rounded-[32px] border border-border bg-surface px-6 py-8 text-center shadow-[0_18px_38px_rgba(31,41,55,0.07)]">
          <p className="text-sm text-text-muted">Focus timer</p>
          <div
            className={`mt-4 text-6xl font-semibold tabular-nums tracking-[-0.05em] text-text transition-all duration-300 sm:text-7xl ${
              isRunning ? 'scale-[1.01]' : ''
            }`}
          >
            {formatTime(seconds)}
          </div>
          <p className="mt-3 text-sm text-text-muted">
            {isRunning ? 'Reading in progress' : seconds === 0 ? 'Ready when you are' : 'Timer paused'}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {seconds === 0 ? (
              <Button
                className="h-12 rounded-full px-8 shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
                onClick={() => void handleToggleTimer()}
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
                  onClick={() => void handleToggleTimer()}
                >
                  <span className="inline-flex items-center gap-2">
                    {isRunning ? <Pause size={18} /> : <Play size={18} />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-danger/35 bg-surface text-danger hover:bg-danger-soft"
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

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                void handleOpenWordLookup();
              }}
              disabled={isPreparingLookup}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent-soft px-5 text-sm font-medium text-accent-strong transition-colors hover:bg-accent-soft/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={16} />
              {isPreparingLookup ? 'Preparing...' : 'Look up Word'}
            </button>
            {activeSession ? (
              <button
                onClick={() => setShowNoteModal(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-soft px-5 text-sm font-medium text-brand-strong transition-colors hover:bg-brand-soft/80"
              >
                + Note
              </button>
            ) : null}
          </div>

          {actionError ? <p className="mt-4 text-sm text-danger">{actionError}</p> : null}
        </section>

        <ReadingMusicPlayer />

        <section className="mt-4 rounded-[24px] border border-border bg-surface shadow-[0_12px_26px_rgba(31,41,55,0.05)]">
          <button
            type="button"
            onClick={() => setIsLookedUpWordsExpanded((currentValue) => !currentValue)}
            className="flex w-full items-center justify-between gap-3 rounded-[24px] px-4 py-3 text-left transition-colors hover:bg-surface-alt/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
            aria-expanded={isLookedUpWordsExpanded}
            aria-controls="looked-up-words-panel"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted">
                <Search size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-[0.22em] text-text-subtle">Looked up Words</span>
                <span className="mt-1 block truncate text-sm font-medium text-text">
                  {recentWordLookups.length === 0 ? 'No words looked up yet' : `${recentWordLookups.length} words this session`}
                </span>
              </span>
            </span>

            <ChevronDown
              size={18}
              className={`shrink-0 text-text-muted transition-transform ${
                isLookedUpWordsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isLookedUpWordsExpanded ? (
            <div id="looked-up-words-panel" className="mx-4 border-t border-border/70 pb-4 pt-4">
              {recentWordLookups.length === 0 ? (
                <div className="rounded-[20px] bg-surface-muted px-4 py-5 text-sm leading-relaxed text-text-muted">
                  Pause when you encounter unfamiliar words to look them up.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {recentWordLookups.map((lookup) => {
                    const phoneticText = extractPhoneticText(lookup.phonetics);

                    return (
                      <button
                        key={lookup.id}
                        type="button"
                        onClick={() => setSelectedLookup(lookup)}
                        className="rounded-[20px] border border-border bg-surface-alt px-4 py-3 text-left shadow-[0_10px_22px_rgba(31,41,55,0.05)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-surface-muted hover:shadow-[0_14px_26px_rgba(31,41,55,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        aria-label={`Open details for ${lookup.lemma}`}
                      >
                        <span className="block truncate text-base font-semibold text-text">{lookup.lemma}</span>
                        <span className="mt-1 block truncate text-sm font-medium italic text-text-muted">
                          {phoneticText ? `/${phoneticText}/` : 'No phonetic'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>

      <WordLookupDetailsDialog
        lookup={selectedLookup}
        onClose={() => setSelectedLookup(null)}
      />

      <WordLookupModal
        isOpen={showWordLookupModal}
        onClose={() => setShowWordLookupModal(false)}
        sessionId={activeSession?.id}
        bookId={bookId}
        onCapture={handleCaptureWord}
        onLookupSaved={handleLookupSaved}
      />

      <NoteModal
        isOpen={showNoteModal}
        heading="Add Note"
        submitLabel="Save note"
        bookTotalPages={book.totalPages}
        initialPageNumber={noteInitialPage}
        availableTags={noteTags.tags}
        isTagsLoading={noteTags.isLoading}
        tagLoadError={noteTags.errorMessage}
        onCreateTag={noteTags.createTag}
        onClose={() => setShowNoteModal(false)}
        onSubmit={handleSaveNote}
      />

      {showReflectionModal ? (
        <ReflectionModal
          key={`${activeSession?.id ?? 'new'}:${draftStartPage}:${draftEndPage}:${draftReflection}`}
          durationSeconds={seconds}
          book={book}
          startPage={draftStartPage}
          initialEndPage={draftEndPage}
          initialReflection={draftReflection}
          wordsCount={recentWordLookups.length}
          onClose={() => setShowReflectionModal(false)}
          onSubmit={handleSaveSession}
        />
      ) : null}

      {noteToastMessage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text shadow-[0_14px_28px_rgba(17,24,39,0.16)]">
            <Check size={14} className="text-brand-strong" />
            {noteToastMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface ReflectionModalProps {
  durationSeconds: number;
  book: ApiBook;
  startPage: number;
  initialEndPage: number;
  initialReflection: string;
  wordsCount: number;
  onClose: () => void;
  onSubmit: (reflection: string, endPage: number) => Promise<void>;
}

function ReflectionModal({
  durationSeconds,
  book,
  startPage,
  initialEndPage,
  initialReflection,
  wordsCount,
  onClose,
  onSubmit,
}: ReflectionModalProps) {
  const [reflection, setReflection] = useState(initialReflection);
  const [endPage, setEndPage] = useState(String(initialEndPage));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmedReflectionLength = reflection.trim().length;
  const isValidReflection = trimmedReflectionLength >= 50 && trimmedReflectionLength <= 2000;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const parsedEndPage = Number(endPage);
    const trimmedReflection = reflection.trim();

    if (!Number.isInteger(parsedEndPage)) {
      setSubmitError('Enter a valid whole number for end page.');
      return;
    }

    if (parsedEndPage < 0) {
      setSubmitError('End page must be zero or greater.');
      return;
    }

    if (parsedEndPage < startPage) {
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
      await onSubmit(trimmedReflection, parsedEndPage);
    } catch (error) {
      console.error('Error completing session:', error);
      setSubmitError(getErrorMessage(error, 'Could not save session. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      isOpen
      onClose={onClose}
      canClose={!isSubmitting}
      contentClassName="w-full max-w-md rounded-[32px] border border-border bg-surface p-6 shadow-[0_24px_48px_rgba(17,24,39,0.18)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
            <BookOpen size={28} className="text-brand-strong" />
          </div>
          <AppDialogTitle className="mt-4 text-2xl font-semibold text-text">
            Session complete
          </AppDialogTitle>
          <p className="mt-2 text-sm text-text-muted">
            {formatTime(durationSeconds)} - {wordsCount} words looked up
          </p>
        </div>
        <AppDialogClose asChild>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close session summary"
          >
            <X size={18} className="text-text-muted" />
          </button>
        </AppDialogClose>
      </div>

      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="mt-6 space-y-4"
        noValidate
      >
          <div className="flex items-center gap-3 rounded-[24px] bg-surface-muted p-4">
            <BookCover
              title={book.title}
              author={book.author}
              coverImageUrl={book.coverImageUrl}
              size="xs"
              className="shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Book</p>
              <p className="mt-1 text-base font-semibold text-text">{book.title}</p>
              <p className="mt-1 text-sm text-text-muted">{book.author}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] bg-surface-muted px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Start Page</p>
              <p className="mt-2 text-lg font-semibold text-text">{startPage}</p>
            </div>
            <div>
              <label htmlFor="session-end-page" className={fieldLabelClassName}>End Page</label>
              <input
                id="session-end-page"
                name="endPage"
                type="number"
                value={endPage}
                onChange={(event) => setEndPage(event.target.value)}
                className={inputClassName}
                inputMode="numeric"
                aria-describedby="session-end-page-hint"
                required
              />
              <p id="session-end-page-hint" className={fieldHintClassName}>
                Enter the last page you reached in this session.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="session-reflection" className={fieldLabelClassName}>Reflection</label>
            <textarea
              id="session-reflection"
              name="reflection"
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What stood out in this session? What did you notice, learn, or enjoy?"
              className={`min-h-[140px] ${textareaClassName}`}
              aria-describedby="session-reflection-hint"
            />
            <p id="session-reflection-hint" className={`mt-2 text-xs ${isValidReflection ? 'text-brand-strong' : 'text-text-muted'}`}>
              {trimmedReflectionLength}/50 characters minimum
            </p>
          </div>

          {submitError ? <p className={fieldErrorClassName}>{submitError}</p> : null}

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
    </AppDialog>
  );
}
