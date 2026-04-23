import { createContext } from 'react';
import type { ApiBook } from '../../api/api';

export interface RefreshBooksOptions {
  silent?: boolean;
}

export interface BooksContextValue {
  books: ApiBook[];
  isLoading: boolean;
  errorMessage: string | null;
  refreshBooks: (options?: RefreshBooksOptions) => Promise<ApiBook[]>;
  upsertBook: (book: ApiBook) => void;
  removeBook: (bookId: string | number) => void;
}

export const BooksContext = createContext<BooksContextValue | null>(null);
