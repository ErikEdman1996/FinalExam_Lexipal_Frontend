import { createContext } from 'react';
import type { BookData } from '../../components/BookCard';

export interface BookTransitionState {
  activeBook: BookData | null;
  originRect: DOMRect | null;
  start: (book: BookData, rect: DOMRect) => void;
  clear: () => void;
}

export const BookTransitionContext = createContext<BookTransitionState | null>(null);
