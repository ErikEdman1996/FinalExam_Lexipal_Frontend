import { createContext } from 'react';
import type { ApiBook, LibraryItemResponseDTO } from '../../api/api';

export interface RefreshBooksOptions {
  silent?: boolean;
}

export interface RefreshLibraryItemsOptions {
  silent?: boolean;
}

export interface BooksContextValue {
  books: ApiBook[];
  libraryItems: LibraryItemResponseDTO[];
  isLoading: boolean;
  isLibraryItemsLoading: boolean;
  errorMessage: string | null;
  libraryItemsErrorMessage: string | null;
  refreshBooks: (options?: RefreshBooksOptions) => Promise<ApiBook[]>;
  refreshLibraryItems: (options?: RefreshLibraryItemsOptions) => Promise<LibraryItemResponseDTO[]>;
  upsertBook: (book: ApiBook) => void;
  removeBook: (bookId: string | number) => void;
}

export const BooksContext = createContext<BooksContextValue | null>(null);
