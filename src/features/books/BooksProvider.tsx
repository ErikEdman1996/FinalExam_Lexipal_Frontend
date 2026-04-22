import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { getBooks, type ApiBook } from '../../api/api';

interface RefreshBooksOptions {
  silent?: boolean;
}

interface BooksContextValue {
  books: ApiBook[];
  isLoading: boolean;
  errorMessage: string | null;
  refreshBooks: (options?: RefreshBooksOptions) => Promise<ApiBook[]>;
  upsertBook: (book: ApiBook) => void;
  removeBook: (bookId: string | number) => void;
}

const BooksContext = createContext<BooksContextValue | null>(null);

export function BooksProvider({ children }: PropsWithChildren) {
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  const refreshBooks = useCallback(async (options?: RefreshBooksOptions) => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    if (!options?.silent) {
      setIsLoading(true);
      setErrorMessage(null);
    }

    try {
      const nextBooks = await getBooks();

      if (latestRequestRef.current === requestId) {
        startTransition(() => {
          setBooks(nextBooks);
        });
        setErrorMessage(null);
      }

      return nextBooks;
    } catch (error) {
      if (latestRequestRef.current === requestId && !options?.silent) {
        setErrorMessage('Could not load books from backend.');
      }

      throw error;
    } finally {
      if (latestRequestRef.current === requestId && !options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshBooks();
  }, [refreshBooks]);

  const value = useMemo<BooksContextValue>(() => ({
    books,
    isLoading,
    errorMessage,
    refreshBooks,
    upsertBook: (book) => {
      startTransition(() => {
        setBooks((currentBooks) => {
          const existingIndex = currentBooks.findIndex((currentBook) => currentBook.id === book.id);

          if (existingIndex === -1) {
            return [...currentBooks, book];
          }

          return currentBooks.map((currentBook) => {
            return currentBook.id === book.id ? book : currentBook;
          });
        });
      });
    },
    removeBook: (bookId) => {
      const normalizedBookId = Number(bookId);

      startTransition(() => {
        setBooks((currentBooks) => currentBooks.filter((book) => book.id !== normalizedBookId));
      });
    },
  }), [books, errorMessage, isLoading, refreshBooks]);

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBooks() {
  const context = useContext(BooksContext);

  if (!context) {
    throw new Error('useBooks must be used within a BooksProvider.');
  }

  return context;
}
