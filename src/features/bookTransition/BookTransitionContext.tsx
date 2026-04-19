import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { BookData } from '../../components/BookCard';
import { BookPickupOverlay } from '../../components/BookPickupOverlay';

interface BookTransitionState {
  activeBook: BookData | null;
  originRect: DOMRect | null;
  start: (book: BookData, rect: DOMRect) => void;
  clear: () => void;
}

const BookTransitionCtx = createContext<BookTransitionState | null>(null);

export function BookTransitionProvider({ children }: { children: ReactNode }) {
  const [activeBook, setActiveBook] = useState<BookData | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const start = useCallback((book: BookData, rect: DOMRect) => {
    setActiveBook(book);
    setOriginRect(rect);
  }, []);

  const clear = useCallback(() => {
    setActiveBook(null);
    setOriginRect(null);
  }, []);

  const value = useMemo(
    () => ({ activeBook, originRect, start, clear }),
    [activeBook, originRect, start, clear],
  );

  return (
    <BookTransitionCtx.Provider value={value}>
      {children}
      {activeBook && originRect && (
        <BookPickupOverlay book={activeBook} originRect={originRect} onComplete={clear} />
      )}
    </BookTransitionCtx.Provider>
  );
}

export function useBookTransition(): BookTransitionState {
  const ctx = useContext(BookTransitionCtx);
  if (!ctx) {
    throw new Error('useBookTransition must be used within BookTransitionProvider');
  }
  return ctx;
}
