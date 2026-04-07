import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, Play } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { getBook, getSessionsByBook, type ApiBook, type ApiSession } from '../api/api';

interface SessionData {
  id: string;
  date: string;
  duration: number;
  startPage: number;
  endPage: number;
  reflection: string;
}

function formatSessionDate(session: ApiSession) {
  const parsed = new Date(session.sessionDate);

  if (Number.isNaN(parsed.getTime())) {
    return session.sessionDate;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function mapApiSessionToSessionData(session: ApiSession): SessionData {
  return {
    id: String(session.id),
    date: formatSessionDate(session),
    duration: Math.ceil(session.durationSeconds / 60),
    startPage: session.startPage,
    endPage: session.endPage,
    reflection: session.reflection,
  };
}

function calculateCompletionPercentage(book: ApiBook) {
  if (book.totalPages <= 0) {
    return 0;
  }

  return Math.round((book.readPages / book.totalPages) * 100);
}

export default function BookDetails() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [expandedReflection, setExpandedReflection] = useState<string | null>(null);
  const [book, setBook] = useState<ApiBook | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadBookDetails = async () => {
      if (!bookId) {
        setErrorMessage('Missing book id.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [bookResponse, sessionsResponse] = await Promise.all([
          getBook(bookId),
          getSessionsByBook(bookId),
        ]);

        const completedSessions = sessionsResponse.filter((session) => session.status === 'COMPLETED');

        setBook(bookResponse);
        setSessions(completedSessions.map(mapApiSessionToSessionData));
      } catch (error) {
        console.error('Error loading book details:', error);
        setErrorMessage('Could not load book details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookDetails();
  }, [bookId]);
  
  const formatDuration = (minutes: number) => {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  };
  
  const startNewSession = () => {
    navigate(`/book/${bookId}/session/new`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] pb-6">
        <div className="max-w-[480px] mx-auto px-6 py-10 text-center text-[#6C757D]">Loading book details...</div>
      </div>
    );
  }

  if (errorMessage || !book) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] pb-6">
        <div className="max-w-[480px] mx-auto px-6 py-10 text-center">
          <p className="text-[#FF6B6B] text-lg">{errorMessage ?? 'Book not found.'}</p>
          <button
            onClick={() => navigate('/library')}
            className="mt-4 text-[#6C757D] hover:text-[#2C3E50]"
          >
            Go back to Library
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateCompletionPercentage(book);
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-6">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] sticky top-0 z-10">
        <div className="max-w-[480px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/library')}
              className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
            >
              <ArrowLeft size={20} className="text-[#2C3E50]" />
            </button>
            <div className="flex-1">
              <h1 className="font-semibold text-[#2C3E50]">{book.title}</h1>
              <p className="text-sm text-[#6C757D]">{book.author}</p>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6C757D]">Overall Progress</span>
              <span className="text-[#A8E6CF] font-medium">{completionPercentage}%</span>
            </div>
            <ProgressBar current={book.readPages} total={book.totalPages} color="mint" height="lg" />
            <p className="text-xs text-[#6C757D] mt-2">
              {book.readPages} / {book.totalPages} pages
            </p>
          </div>
          
          <Button variant="primary" className="w-full h-12" onClick={startNewSession}>
            <Play size={20} className="mr-2" />
            Start New Session
          </Button>
        </div>
      </div>
      
      {/* Session Timeline */}
      <div className="max-w-[480px] mx-auto px-6 py-6">
        <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">Session History</h2>
        
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[#6C757D]">No sessions yet for this book.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const pagesRead = Math.max(0, session.endPage - session.startPage);
            const isExpanded = expandedReflection === session.id;
            const reflectionPreview = session.reflection.slice(0, 100);
            const needsTruncation = session.reflection.length > 100;
            
            return (
              <div
                key={session.id}
                className="bg-white rounded-[24px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.05)]"
              >
                {/* Session Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[#2C3E50]">Session {session.id}</h3>
                    <p className="text-sm text-[#6C757D]">{session.date}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#A8E6CF]">
                    <Clock size={16} />
                    <span className="text-sm font-medium">{formatDuration(session.duration)}</span>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="bg-[#F8F9FA] rounded-[16px] p-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#6C757D]">Pages {session.startPage} - {session.endPage}</span>
                    <span className="text-[#A8E6CF] font-medium">{pagesRead} pages</span>
                  </div>
                  <ProgressBar
                    current={pagesRead}
                    total={book.totalPages}
                    color="blue"
                    height="sm"
                  />
                </div>
                
                {/* Reflection */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[#2C3E50] mb-2 flex items-center gap-2">
                    <BookOpen size={16} className="text-[#D4C5F9]" />
                    Reflection
                  </h4>
                  <p className="text-sm text-[#6C757D] leading-relaxed">
                    {isExpanded ? session.reflection : reflectionPreview}
                    {needsTruncation && !isExpanded && '...'}
                  </p>
                  {needsTruncation && (
                    <button
                      onClick={() => setExpandedReflection(isExpanded ? null : session.id)}
                      className="text-sm text-[#A8E6CF] hover:text-[#C8F5E1] mt-2 font-medium"
                    >
                      {isExpanded ? 'Read Less' : 'Read More'}
                    </button>
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
