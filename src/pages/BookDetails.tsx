import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, Play, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { deleteBook, getActiveSessionByBook, getBook, getSessionsByBook, type ApiBook, type ApiSession } from '../api/api';

interface SessionData {
  id: string;
  date: string;
  createdAtMs: number;
  durationSeconds: number;
  pagesRead: number;
  startPage: number;
  endPage: number;
  reflection: string;
}

function formatSessionDate(timestamp: string | null | undefined) {
  const parsed = new Date(timestamp ?? '');

  if (Number.isNaN(parsed.getTime())) {
    return timestamp || 'Unknown date';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function mapApiSessionToSessionData(session: ApiSession): SessionData {
  const completedTimestamp = session.completedAt ?? session.sessionDate;
  const parsedDate = new Date(completedTimestamp);

  return {
    id: String(session.id),
    date: formatSessionDate(completedTimestamp),
    createdAtMs: Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime(),
    durationSeconds: Math.max(0, session.durationSeconds),
    pagesRead: Math.max(0, session.pagesRead || session.endPage - session.startPage),
    startPage: session.startPage,
    endPage: session.endPage,
    reflection: session.reflection?.trim() || '',
  };
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function calculateCompletionPercentage(book: ApiBook) {
  if (book.totalPages <= 0) {
    return 0;
  }

  return (book.readPages / book.totalPages) * 100;
}

export default function BookDetails() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<ApiBook | null>(null);
  const [activeDraft, setActiveDraft] = useState<ApiSession | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadBookDetails = async () => {
      if (!bookId) {
        if (isMounted) {
          setErrorMessage('Missing book id.');
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [bookResponse, sessionsResponse, activeDraftResponse] = await Promise.all([
          getBook(bookId),
          getSessionsByBook(bookId),
          getActiveSessionByBook(bookId),
        ]);

        const completedSessions = sessionsResponse
          .map(mapApiSessionToSessionData)
          .sort((left, right) => right.createdAtMs - left.createdAtMs);

        if (isMounted) {
          setBook(bookResponse);
          setActiveDraft(activeDraftResponse);
          setSessions(completedSessions);
          setSelectedSession(null);
        }
      } catch (error) {
        console.error('Error loading book details:', error);

        if (isMounted) {
          setErrorMessage('Could not load book details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBookDetails();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const handleDeleteBook = async () => {
    if (!bookId || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteBook(bookId);
      navigate('/library');
    } catch (error) {
      console.error('Error deleting book:', error);
      setErrorMessage('Could not delete this book right now.');
      setIsDeleting(false);
    }
  };

  const completionPercentage = useMemo(
    () => (book ? calculateCompletionPercentage(book) : 0),
    [book],
  );

  const latestSession = sessions[0] ?? null;
  const highlightedSession = selectedSession ?? latestSession;
  const pagesRemaining = Math.max((book?.totalPages ?? 0) - (book?.readPages ?? 0), 0);
  const activeDraftCurrentPage = activeDraft
    ? Math.max(activeDraft.endPage, activeDraft.startPage)
    : 0;

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-text-muted sm:px-6 lg:px-8">
          Loading book details...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !book) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-danger">{errorMessage ?? 'Book not found.'}</p>
          <button
            onClick={() => navigate('/library')}
            className="mt-4 text-sm text-text-muted transition-colors hover:text-text"
          >
            Go back to Library
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <motion.div
      className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          onClick={() => navigate('/library')}
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={16} />
          Back to library
        </button>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-border bg-surface p-6 shadow-[0_18px_36px_rgba(31,41,55,0.07)] sm:p-7">
              <p className="text-[0.72rem] uppercase tracking-[0.3em] text-text-subtle">Book details</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-text sm:text-4xl">
                {book.title}
              </h1>
              <p className="mt-2 text-base text-text-muted">{book.author}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Sessions</p>
                  <p className="mt-2 text-2xl font-semibold text-text">{sessions.length}</p>
                </div>
                <div className="rounded-[22px] bg-brand-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-strong">Pages read</p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">{book.readPages}</p>
                </div>
                <div className="rounded-[22px] bg-accent-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-accent-strong">Pages left</p>
                  <p className="mt-2 text-2xl font-semibold text-accent-strong">{pagesRemaining}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[26px] border border-border bg-surface-alt p-5">
                <div className="flex items-center justify-between text-sm text-text-muted">
                  <span>{book.readPages} / {book.totalPages} pages</span>
                  <span>{Math.round(completionPercentage)}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-500"
                    style={{ width: `${Math.max(completionPercentage, 4)}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate(`/book/${book.id}/session/new`)}
                  className="rounded-full px-6 shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Play size={16} />
                    {activeDraft ? 'Resume Session' : 'Start Session'}
                  </span>
                </Button>
                <button
                  onClick={() => void handleDeleteBook()}
                  disabled={isDeleting}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-danger/35 bg-surface text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Delete book"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </section>

            {activeDraft ? (
              <section className="rounded-[28px] border border-brand/20 bg-brand-soft/60 p-5 shadow-[0_16px_32px_rgba(31,41,55,0.06)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-brand-strong">Active Draft</p>
                    <h2 className="mt-2 text-2xl font-semibold text-text">Resume your in-progress session</h2>
                    <p className="mt-2 text-sm text-text-muted">
                      Started {formatSessionDate(activeDraft.sessionDate)}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/book/${book.id}/session/new`)}
                    className="rounded-full px-6 sm:self-center"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Play size={16} />
                      Resume Session
                    </span>
                  </Button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-surface p-4 text-center">
                    <Clock size={16} className="mx-auto mb-2 text-brand-strong" />
                    <p className="text-base font-semibold text-text">{formatDuration(activeDraft.durationSeconds)}</p>
                    <p className="mt-1 text-xs text-text-muted">Time logged</p>
                  </div>
                  <div className="rounded-[20px] bg-surface p-4 text-center">
                    <FileText size={16} className="mx-auto mb-2 text-accent-strong" />
                    <p className="text-base font-semibold text-text">{activeDraftCurrentPage}</p>
                    <p className="mt-1 text-xs text-text-muted">Current page</p>
                  </div>
                  <div className="rounded-[20px] bg-surface p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Captured words</p>
                    <p className="mt-2 text-base font-semibold text-text">{activeDraft.capturedWordCount}</p>
                  </div>
                </div>
              </section>
            ) : null}

            {highlightedSession ? (
              <section className={`rounded-[28px] border border-border bg-surface p-5 shadow-[0_16px_32px_rgba(31,41,55,0.06)] ${selectedSession ? '' : 'hidden lg:block'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">
                      {selectedSession ? 'Session Details' : 'Latest Session'}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-text">{highlightedSession.date}</h2>
                  </div>
                  {selectedSession ? (
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text lg:hidden"
                    >
                      <ArrowLeft size={14} />
                      All sessions
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-accent-soft p-4 text-center">
                    <Clock size={16} className="mx-auto mb-2 text-accent-strong" />
                    <p className="text-base font-semibold text-text">{formatDuration(highlightedSession.durationSeconds)}</p>
                    <p className="mt-1 text-xs text-text-muted">Duration</p>
                  </div>
                  <div className="rounded-[20px] bg-brand-soft p-4 text-center">
                    <FileText size={16} className="mx-auto mb-2 text-brand-strong" />
                    <p className="text-base font-semibold text-text">{highlightedSession.pagesRead}</p>
                    <p className="mt-1 text-xs text-text-muted">Pages read</p>
                  </div>
                  <div className="rounded-[20px] bg-surface-muted p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Page range</p>
                    <p className="mt-2 text-base font-semibold text-text">
                      {highlightedSession.startPage} - {highlightedSession.endPage}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Reflection</p>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {highlightedSession.reflection || 'No reflection recorded.'}
                  </p>
                </div>
              </section>
            ) : null}
          </div>

          <aside className={`${selectedSession ? 'hidden lg:block' : ''}`}>
            <section className="rounded-[30px] border border-border bg-surface p-5 shadow-[0_16px_32px_rgba(31,41,55,0.06)] lg:sticky lg:top-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Reading history</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text">Sessions</h2>
                </div>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-text-muted">
                  {sessions.length}
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="mt-5 rounded-[24px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
                  No sessions yet. Start reading to build your history.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {sessions.map((session) => {
                    const isActive = highlightedSession?.id === session.id;

                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`flex w-full items-center gap-4 rounded-[24px] border p-4 text-left transition-all duration-200 ${
                          isActive
                            ? 'border-brand bg-brand-soft shadow-[0_12px_24px_rgba(154,74,66,0.12)]'
                            : 'border-border bg-surface hover:-translate-y-0.5 hover:bg-surface-alt'
                        }`}
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          isActive ? 'bg-brand text-text-on-brand' : 'bg-surface-muted text-text'
                        }`}>
                          {session.date.split(' ')[1] ?? session.date}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text">
                            {formatDuration(session.durationSeconds)} - {session.pagesRead} pages
                          </p>
                          <p className="mt-1 text-xs text-text-muted">{session.date}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <BottomNav />
    </motion.div>
  );
}
