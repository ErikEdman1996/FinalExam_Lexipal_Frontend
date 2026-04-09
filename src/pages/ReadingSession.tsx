import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { CircularTimer, type CircularTimerHandle } from '../components/CircularTimer.tsx';
import { Button } from '../components/Button';
import { WordLookupModal } from '../components/WordLookupModal';
import { createSession, updateSession } from '../api/api';

interface SessionCodexEntry {
  lemma: string;
  definition: string;
  synonyms: string[];
}

export default function ReadingSession() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showWordLookupModal, setShowWordLookupModal] = useState(false);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);
  const [codexEntries, setCodexEntries] = useState<SessionCodexEntry[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const timerRef = useRef<CircularTimerHandle | null>(null);
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
    const initializeSession = async () => {
      if (!bookId) {
        return;
      }

      const parsedBookId = Number(bookId);

      if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
        return;
      }

      try {
        await ensureSessionInitialized(parsedBookId);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    void initializeSession();
  }, [bookId, ensureSessionInitialized]);

  useEffect(() => {
    if (showWordLookupModal) {
      const wasRunning = timerRef.current?.isRunning() ?? false;
      shouldResumeAfterLookupRef.current = wasRunning;

      if (wasRunning) {
        timerRef.current?.pause();
      }

      return;
    }

    if (shouldResumeAfterLookupRef.current) {
      timerRef.current?.resume();
      shouldResumeAfterLookupRef.current = false;
    }
  }, [showWordLookupModal]);
  
  const handleStopSession = (durationSeconds: number) => {
    setSessionDurationSeconds(durationSeconds);
    setShowReflectionModal(true);
  };

  const handleSaveSession = async (reflection: string, _startPage: number, endPage: number) => {
    if (!bookId) {
      throw new Error('Missing book id');
    }

    const parsedBookId = Number(bookId);

    if (!Number.isFinite(parsedBookId) || parsedBookId <= 0) {
      throw new Error('Invalid book id');
    }

    if (sessionDurationSeconds <= 0) {
      throw new Error('Session duration must be greater than 0');
    }

    const trimmedReflection = reflection.trim();

    if (trimmedReflection.length > 2000) {
      throw new Error('Reflection must be 2000 characters or fewer');
    }

    if (!Number.isInteger(endPage) || endPage < 0) {
      throw new Error('End page must be zero or greater');
    }

    const sessionId = await ensureSessionInitialized(parsedBookId);

    await updateSession(sessionId, {
      durationSeconds: sessionDurationSeconds,
      endPage,
      reflection: trimmedReflection,
      status: 'COMPLETED',
    });

    navigate(`/book/${bookId}`);
  };

  const handleCaptureWord = (codexEntry: SessionCodexEntry, newCapture: boolean) => {
    if (!newCapture) {
      return;
    }

    setCodexEntries((previousEntries) => {
      if (previousEntries.some((word) => word.lemma.toLowerCase() === codexEntry.lemma.toLowerCase())) {
        return previousEntries;
      }

      return [...previousEntries, codexEntry];
    });
  };
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] px-6 py-4">
        <div className="max-w-[480px] mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={20} className="text-[#2C3E50]" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-[#2C3E50]">Reading Session</h1>
            <p className="text-sm text-[#6C757D]">Focus mode</p>
          </div>
          <BookOpen size={24} className="text-[#A8E6CF]" />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-[480px] w-full">
          {/* Timer */}
          <CircularTimer ref={timerRef} onStop={handleStopSession} />
          
          {/* Word Capture Section */}
          <div className="mt-12 space-y-4">
            <Button variant="outline" className="w-full h-12" onClick={() => setShowWordLookupModal(true)}>
              Look Up Word
            </Button>
            <p className="text-sm text-[#6C757D] text-center">
              {codexEntries.length} words captured this session
            </p>
          </div>
        </div>
      </div>

      {/* Word Lookup Modal */}
      <WordLookupModal
        isOpen={showWordLookupModal}
        onClose={() => setShowWordLookupModal(false)}
        codexEntryLemmas={codexEntries.map((codexEntry) => codexEntry.lemma)}
        sessionId={activeSessionId}
        onCapture={handleCaptureWord}
      />
      
      {/* Reflection Modal */}
      {showReflectionModal && (
        <ReflectionModal
          onClose={() => setShowReflectionModal(false)}
          onSubmit={handleSaveSession}
          wordsCount={codexEntries.length}
        />
      )}
    </div>
  );
}

interface ReflectionModalProps {
  onClose: () => void;
  onSubmit: (reflection: string, startPage: number, endPage: number) => void;
  wordsCount: number;
}

function ReflectionModal({ onClose, onSubmit, wordsCount }: ReflectionModalProps) {
  const [reflection, setReflection] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedReflection = reflection.trim();
    const parsedStartPage = Number(startPage);
    const parsedEndPage = Number(endPage);

    if (trimmedReflection.length < 50) {
      setSubmitError('Reflection must be at least 50 characters.');
      return;
    }

    if (trimmedReflection.length > 2000) {
      setSubmitError('Reflection must be 2000 characters or fewer.');
      return;
    }

    if (!startPage || !endPage || !Number.isInteger(parsedStartPage) || !Number.isInteger(parsedEndPage)) {
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
  
  const charCount = reflection.trim().length;
  const isValid = charCount >= 50 && charCount <= 2000;
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Session Complete! 🎉</h2>
        <p className="text-sm text-[#6C757D] mb-6">You captured {wordsCount} words</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-[#2C3E50] mb-2">Start Page</label>
              <input
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-[#2C3E50] mb-2">End Page</label>
              <input
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-[#2C3E50] mb-2">
              Reflection (min. 50 characters)
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all min-h-[120px] resize-none"
              placeholder="What did you think about what you read? What stood out to you?"
              required
            />
            <div className={`text-xs mt-2 ${isValid ? 'text-[#A8E6CF]' : 'text-[#6C757D]'}`}>
              {charCount}/50 characters
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Session'}
            </Button>
          </div>

          {submitError ? (
            <p className="text-sm text-[#FF6B6B] mt-2">{submitError}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
