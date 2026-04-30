import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  getBooks,
  getLibraryItems,
  type ApiBook,
  type LibraryItemResponseDTO,
} from '../../api/api';
import {
  BooksContext,
  type BooksContextValue,
  type RefreshBooksOptions,
  type RefreshLibraryItemsOptions,
} from './BooksContext';

export function BooksProvider({ children }: PropsWithChildren) {
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItemResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLibraryItemsLoading, setIsLibraryItemsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [libraryItemsErrorMessage, setLibraryItemsErrorMessage] = useState<string | null>(null);
  const latestRequestRef = useRef(0);
  const latestLibraryItemsRequestRef = useRef(0);

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

  const refreshLibraryItems = useCallback(async (options?: RefreshLibraryItemsOptions) => {
    const requestId = latestLibraryItemsRequestRef.current + 1;
    latestLibraryItemsRequestRef.current = requestId;

    if (!options?.silent) {
      setIsLibraryItemsLoading(true);
      setLibraryItemsErrorMessage(null);
    }

    try {
      const nextLibraryItems = await getLibraryItems();

      if (latestLibraryItemsRequestRef.current === requestId) {
        startTransition(() => {
          setLibraryItems(nextLibraryItems);
        });
        setLibraryItemsErrorMessage(null);
      }

      return nextLibraryItems;
    } catch (error) {
      if (latestLibraryItemsRequestRef.current === requestId && !options?.silent) {
        setLibraryItemsErrorMessage('Could not load your library from backend.');
      }

      throw error;
    } finally {
      if (latestLibraryItemsRequestRef.current === requestId && !options?.silent) {
        setIsLibraryItemsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshBooks().catch((error) => {
      console.error('Error loading initial books:', error);
    });
    void refreshLibraryItems().catch((error) => {
      console.error('Error loading initial library items:', error);
    });
  }, [refreshBooks, refreshLibraryItems]);

  const value = useMemo<BooksContextValue>(() => ({
    books,
    libraryItems,
    isLoading,
    isLibraryItemsLoading,
    errorMessage,
    libraryItemsErrorMessage,
    refreshBooks,
    refreshLibraryItems,
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
        setLibraryItems((currentItems) => {
          return currentItems.filter((item) => item.itemType !== 'BOOK' || item.itemId !== normalizedBookId);
        });
      });
    },
  }), [
    books,
    errorMessage,
    isLibraryItemsLoading,
    isLoading,
    libraryItems,
    libraryItemsErrorMessage,
    refreshBooks,
    refreshLibraryItems,
  ]);

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}
