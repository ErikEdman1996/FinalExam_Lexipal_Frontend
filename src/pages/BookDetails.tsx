import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, Play, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { deleteBook, getBook, getSessionsByBook, type ApiBook, type ApiSession } from '../api/api';

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

function formatSessionDate(session: ApiSession) {
  const parsed = new Date(session.sessionDate);

  if (Number.isNaN(parsed.getTime())) {
    return session.sessionDate || 'Unknown date';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function mapApiSessionToSessionData(session: ApiSession): SessionData {
  const parsedDate = new Date(session.sessionDate);

  return {
    id: String(session.id),
    date: formatSessionDate(session),
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

        const [bookResponse, sessionsResponse] = await Promise.all([
          getBook(bookId),
          getSessionsByBook(bookId),
        ]);

        const completedSessions = sessionsResponse
          .filter((session) => session.status === 'COMPLETED')
          .map(mapApiSessionToSessionData)
          .sort((left, right) => right.createdAtMs - left.createdAtMs);

        if (isMounted) {
          setBook(bookResponse);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_55%,#F8F5FF_100%)] pb-24">
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-[#6A7687]">Loading book details...</div>
      </div>
    );
  }

  if (errorMessage || !book) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_55%,#F8F5FF_100%)] pb-24">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-lg text-[#FF6B6B]">{errorMessage ?? 'Book not found.'}</p>
          <button
            onClick={() => navigate('/library')}
            className="mt-4 text-sm text-[#6A7687] transition-colors hover:text-[#22324A]"
          >
            Go back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_55%,#F8F5FF_100%)] pb-24">
      <div className="mx-auto max-w-lg px-4 py-6">
        <button
          onClick={() => navigate('/library')}
          className="inline-flex items-center gap-2 text-sm text-[#6A7687] transition-colors hover:text-[#22324A]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="mt-5 rounded-[30px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-6 shadow-[0_18px_36px_rgba(31,41,55,0.07)]">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#22324A]">{book.title}</h1>
          <p className="mt-1 text-sm text-[#6A7687]">{book.author}</p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-[#6A7687]">
              <span>{book.readPages} / {book.totalPages} pages</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#E8EEF5]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#A8E6CF_0%,#92D9C8_100%)] transition-[width] duration-500"
                style={{ width: `${Math.max(completionPercentage, 4)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button
              onClick={() => navigate(`/book/${book.id}/session/new`)}
              className="flex-1 rounded-full shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
            >
              <span className="inline-flex items-center gap-2">
                <Play size={16} />
                Start Session
              </span>
            </Button>
            <button
              onClick={() => void handleDeleteBook()}
              disabled={isDeleting}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#F5C6BF] bg-white text-[#C96C61] transition-colors hover:bg-[#FFF5F3] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Delete book"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </section>

        {selectedSession ? (
          <section className="mt-6 rounded-[28px] border border-[rgba(36,52,71,0.08)] bg-white/90 p-5 shadow-[0_16px_32px_rgba(31,41,55,0.06)]">
            <button
              onClick={() => setSelectedSession(null)}
              className="inline-flex items-center gap-2 text-sm text-[#6A7687] transition-colors hover:text-[#22324A]"
            >
              <ArrowLeft size={14} />
              All sessions
            </button>

            <h2 className="mt-4 text-xl font-semibold text-[#22324A]">Session Details</h2>

            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-[20px] bg-[#DCEFFF]/60 p-4">
                <Clock size={16} className="mx-auto mb-2 text-[#4B93D1]" />
                <p className="text-base font-semibold text-[#22324A]">{formatDuration(selectedSession.durationSeconds)}</p>
                <p className="mt-1 text-xs text-[#6A7687]">Duration</p>
              </div>
              <div className="rounded-[20px] bg-[#DFF5EA]/60 p-4">
                <FileText size={16} className="mx-auto mb-2 text-[#3D9B7A]" />
                <p className="text-base font-semibold text-[#22324A]">{selectedSession.pagesRead}</p>
                <p className="mt-1 text-xs text-[#6A7687]">Pages</p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] bg-[#F7F9FC] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Reflection</p>
              <p className="mt-3 text-sm leading-relaxed text-[#4B647C]">
                {selectedSession.reflection || 'No reflection recorded.'}
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A94A6]">
              Sessions ({sessions.length})
            </h2>

            {sessions.length === 0 ? (
              <div className="rounded-[26px] border border-[rgba(36,52,71,0.08)] bg-white/88 px-4 py-8 text-center text-sm text-[#6A7687] shadow-[0_12px_26px_rgba(31,41,55,0.05)]">
                No sessions yet. Start reading to build your history.
              </div>
            ) : (
              sessions.map((session, index) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="flex w-full items-center gap-4 rounded-[24px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-4 text-left shadow-[0_12px_26px_rgba(31,41,55,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFE6D5] text-sm font-semibold text-[#B56A42]">
                    {sessions.length - index}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#22324A]">
                      {formatDuration(session.durationSeconds)} • {session.pagesRead} pages
                    </p>
                    <p className="mt-1 text-xs text-[#6A7687]">{session.date}</p>
                  </div>
                </button>
              ))
            )}
          </section>
        )}
      </div>
    </div>
  );
}
