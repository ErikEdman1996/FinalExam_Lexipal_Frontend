import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { BookPickupOverlay } from '../../components/BookPickupOverlay';
import type { BookData } from '../../components/BookCard';
import { BookTransitionContext } from './BookTransitionStore';

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
    <BookTransitionContext.Provider value={value}>
      {children}
      {activeBook && originRect && (
        <BookPickupOverlay book={activeBook} originRect={originRect} onComplete={clear} />
      )}
    </BookTransitionContext.Provider>
  );
}
