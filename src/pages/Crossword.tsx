import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Grid3x3, RefreshCw, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { CrosswordGrid } from '../components/crossword/CrosswordGrid';
import { ClueList } from '../components/crossword/ClueList';
import { CrosswordResult } from '../components/crossword/CrosswordResult';
import { useCrosswordGame } from '../features/crossword/useCrosswordGame';
import { useXpGain } from '../features/xp/useXpGain';
import {
  ApiResponseError,
  createCrosswordPuzzle,
  getCrosswordPuzzle,
  submitCrosswordPuzzle,
  type CrosswordPuzzleResponse,
  type CrosswordSubmitResponse,
} from '../api/api';

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; data: CrosswordPuzzleResponse }
  | { kind: 'submitted'; data: CrosswordPuzzleResponse; result: CrosswordSubmitResponse }
  | { kind: 'already-submitted'; data: CrosswordPuzzleResponse }
  | { kind: 'not-found' }
  | { kind: 'no-words' }
  | { kind: 'error'; message: string };

export default function Crossword() {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const navigate = useNavigate();
  const { showXpGain } = useXpGain();
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const createPromiseRef = useRef<Promise<CrosswordPuzzleResponse> | null>(null);

  const puzzleData = useMemo(() => {
    if (state.kind === 'ready' || state.kind === 'submitted' || state.kind === 'already-submitted') {
      return state.data;
    }
    return null;
  }, [state]);

  const game = useCrosswordGame(puzzleData?.puzzle ?? null);
  const { lock } = game;

  const resultsByEntryId = useMemo(() => {
    if (state.kind !== 'submitted') return undefined;
    const map: Record<string, boolean> = {};
    for (const item of state.result.answerResults) {
      map[item.entryId] = item.correct;
    }
    return map;
  }, [state]);

  const handleLoadError = useCallback((error: unknown) => {
    createPromiseRef.current = null;
    if (error instanceof ApiResponseError) {
      if (error.status === 404) {
        setState({ kind: 'not-found' });
        return;
      }
      if (error.status === 400) {
        setState({ kind: 'no-words' });
        return;
      }
      setState({ kind: 'error', message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    setState({ kind: 'error', message });
  }, []);

  const createNewCrossword = useCallback(async () => {
    setSubmitting(false);
    setState({ kind: 'loading' });
    const pendingCreate = createPromiseRef.current ?? createCrosswordPuzzle();
    createPromiseRef.current = pendingCreate;

    try {
      const data = await pendingCreate;
      if (createPromiseRef.current === pendingCreate) {
        createPromiseRef.current = null;
      }
      if (data.status === 'SUBMITTED') {
        setState({ kind: 'already-submitted', data });
      } else {
        setState({ kind: 'ready', data });
      }
      void navigate(`/challenges/crossword/${data.id}`, { replace: true });
    } catch (error) {
      if (createPromiseRef.current === pendingCreate) {
        createPromiseRef.current = null;
      }
      handleLoadError(error);
    }
  }, [handleLoadError, navigate]);

  useEffect(() => {
    if (!puzzleId) {
      void createNewCrossword();
      return;
    }

    let cancelled = false;

    const load = async () => {
      setState({ kind: 'loading' });
      try {
        const data = await getCrosswordPuzzle(puzzleId);
        if (cancelled) return;
        if (data.status === 'SUBMITTED') {
          setState({ kind: 'already-submitted', data });
        } else {
          setState({ kind: 'ready', data });
        }
      } catch (error) {
        if (cancelled) return;
        handleLoadError(error);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [createNewCrossword, handleLoadError, puzzleId]);

  useEffect(() => {
    if (state.kind === 'submitted' || state.kind === 'already-submitted') {
      lock();
    }
  }, [state.kind, lock]);

  const handleSubmit = useCallback(async () => {
    if (state.kind !== 'ready' || submitting) return;
    setSubmitting(true);
    try {
      const answers = game.buildAnswersPayload();
      const result = await submitCrosswordPuzzle(state.data.id, answers);
      const updatedPuzzle: CrosswordPuzzleResponse = {
        ...state.data,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        puzzle: result.puzzle,
      };
      setState({ kind: 'submitted', data: updatedPuzzle, result });
      if (result.attempt.xpUpdate) {
        showXpGain({ xpUpdate: result.attempt.xpUpdate, source: 'challenge' });
      }
    } catch (error) {
      if (error instanceof ApiResponseError && error.status === 409) {
        toast.error('This puzzle has already been submitted.');
        try {
          const refreshed = await getCrosswordPuzzle(state.data.id);
          setState({ kind: 'already-submitted', data: refreshed });
        } catch {
          setState({ kind: 'already-submitted', data: state.data });
        }
        return;
      }
      const message = error instanceof Error ? error.message : 'Could not submit puzzle.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [game, showXpGain, state, submitting]);

  const handleNewCrossword = () => {
    void createNewCrossword();
  };

  const handleSubmitClick = () => {
    void handleSubmit();
  };

  const handleHardReload = () => {
    void navigate(0);
  };

  return (
    <div className="page-bg min-h-screen pb-32 lg:pb-0 lg:pl-60">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
        <Header />

        {state.kind === 'idle' || state.kind === 'loading' ? <LoadingCard /> : null}

        {state.kind === 'no-words' ? <NoWordsCard /> : null}
        {state.kind === 'not-found' ? (
          <NotFoundCard onRetry={handleNewCrossword} />
        ) : null}
        {state.kind === 'error' ? (
          <ErrorCard message={state.message} onRetry={handleHardReload} />
        ) : null}

        {puzzleData ? (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex shrink-0 flex-col items-center gap-4 lg:items-start">
              <PuzzleMeta wordCount={puzzleData.puzzle.wordCount} />
              <CrosswordGrid
                puzzle={puzzleData.puzzle}
                getLetter={game.getLetter}
                isCellInActiveEntry={game.isCellInActiveEntry}
                activeCell={game.activeCell}
                activeEntryId={game.activeEntryId}
                cellResultByEntryId={resultsByEntryId}
                locked={game.locked}
                onSelectCell={game.selectCell}
                onTypeLetter={game.typeLetter}
                onBackspace={game.backspace}
                onArrow={game.arrow}
              />
              {state.kind === 'ready' ? (
                <ActionBar
                  onClear={game.clearAll}
                  onSubmit={handleSubmitClick}
                  submitting={submitting}
                />
              ) : null}
              {state.kind === 'already-submitted' ? (
                <AlreadySubmittedNotice onNewCrossword={handleNewCrossword} />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-[1.35]">
              {state.kind === 'submitted' ? (
                <CrosswordResult
                  result={state.result}
                  onNewCrossword={handleNewCrossword}
                />
              ) : null}

              <ClueList
                puzzle={puzzleData.puzzle}
                activeEntryId={game.activeEntryId}
                resultsByEntryId={resultsByEntryId}
                onSelectEntry={game.selectEntry}
              />
            </div>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <Link
          to="/challenges"
          className="inline-flex items-center gap-1 text-sm font-medium text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft size={16} />
          Challenges
        </Link>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-text">
          Crossword
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
          Fill in the grid using the dictionary clues for words you've captured.
        </p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-soft shadow-[0_10px_24px_rgba(62,157,123,0.16)]">
        <Grid3x3 size={26} className="text-brand-strong" />
      </div>
    </div>
  );
}

function PuzzleMeta({ wordCount }: { wordCount: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle shadow-[0_4px_12px_rgba(31,41,55,0.04)]">
      <Sparkles size={12} className="text-accent-strong" />
      {wordCount} words
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="mt-6 rounded-[26px] border border-border bg-surface p-8 text-center text-sm text-text-muted shadow-[0_14px_28px_rgba(31,41,55,0.06)]">
      Building your crossword…
    </div>
  );
}

function NoWordsCard() {
  return (
    <div className="mt-6 rounded-[26px] border border-border bg-surface p-8 shadow-[0_14px_28px_rgba(31,41,55,0.06)]">
      <h2 className="text-2xl font-semibold text-text">Not enough words yet</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        Capture a few more words while you read and we'll have enough to build a crossword.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/library"
          className="inline-flex h-11 items-center rounded-[14px] border border-transparent bg-brand px-4 font-medium text-text-on-brand transition-colors hover:bg-brand-hover"
        >
          Open library
        </Link>
        <Link
          to="/challenges"
          className="inline-flex h-11 items-center rounded-[14px] border border-border bg-surface px-4 font-medium text-text transition-colors hover:bg-surface-alt"
        >
          Back to challenges
        </Link>
      </div>
    </div>
  );
}

function NotFoundCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-[26px] border border-border bg-surface p-8 shadow-[0_14px_28px_rgba(31,41,55,0.06)]">
      <h2 className="text-2xl font-semibold text-text">Puzzle not found</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        This crossword is no longer available, or it isn't yours.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onRetry} className="inline-flex items-center gap-2">
          <RefreshCw size={16} />
          New crossword
        </Button>
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-[26px] border border-danger-soft bg-surface p-8 shadow-[0_14px_28px_rgba(31,41,55,0.06)]">
      <h2 className="text-2xl font-semibold text-text">Something went wrong</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}

interface ActionBarProps {
  onClear: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function ActionBar({ onClear, onSubmit, submitting }: ActionBarProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <Button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="inline-flex items-center gap-2 disabled:opacity-60"
      >
        <Send size={16} />
        {submitting ? 'Submitting…' : 'Submit'}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        disabled={submitting}
        className="inline-flex items-center gap-2"
      >
        Clear
      </Button>
    </div>
  );
}

function AlreadySubmittedNotice({ onNewCrossword }: { onNewCrossword: () => void }) {
  return (
    <div className="rounded-[20px] border border-border bg-surface px-4 py-3 text-sm text-text-muted shadow-[0_8px_18px_rgba(31,41,55,0.04)]">
      <p>This puzzle was already submitted.</p>
      <Button onClick={onNewCrossword} className="mt-3 inline-flex items-center gap-2">
        <RefreshCw size={16} />
        New crossword
      </Button>
    </div>
  );
}
