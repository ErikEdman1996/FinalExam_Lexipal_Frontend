import { useEffect, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createBook, getBooks, type ApiBook, type CreateBookRequest } from '../api/api';
import { AddBookModal } from '../components/AddBookModal.tsx';
import { BookCard, type BookData } from '../components/BookCard.tsx';
import { BottomNav } from '../components/BottomNav.tsx';

type BookStatus = 'active' | 'completed' | 'archived';

interface LibraryBook extends BookData {
  status: BookStatus;
}

interface LibrarySectionProps {
  title: string;
  books: LibraryBook[];
  onOpenBook: (bookId: string) => void;
}

function LibrarySection({ title, books, onOpenBook }: LibrarySectionProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A94A6]">{title}</h2>
      <div className="space-y-3">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onClick={() => onOpenBook(book.id)} />
        ))}
      </div>
    </section>
  );
}

function mapApiStatusToUiStatus(status: ApiBook['status']): BookStatus {
  if (status === 'COMPLETED') {
    return 'completed';
  }

  if (status === 'ARCHIVED') {
    return 'archived';
  }

  return 'active';
}

function mapBackendBookToLibraryBook(book: ApiBook): LibraryBook {
  const safeTotalPages = book.totalPages > 0 ? book.totalPages : 1;
  const safeReadPages = Math.max(0, Math.min(book.readPages, safeTotalPages));
  const sessionCount = Array.isArray(book.sessions)
    ? book.sessions.filter((session) => session.status === 'COMPLETED').length
    : 0;

  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    pagesRead: safeReadPages,
    totalPages: safeTotalPages,
    sessions: sessionCount,
    status: mapApiStatusToUiStatus(book.status),
  };
}

export default function Library() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const apiBooks = await getBooks();

        if (isMounted) {
          setBooks(apiBooks.map(mapBackendBookToLibraryBook));
        }
      } catch (error) {
        console.error('Error loading books:', error);

        if (isMounted) {
          setErrorMessage('Could not load books from backend.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBooks();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddBook = async (newBook: CreateBookRequest) => {
    const createdBook = await createBook(newBook);
    setBooks((previousBooks) => [...previousBooks, mapBackendBookToLibraryBook(createdBook)]);
  };

  const activeBooks = books.filter((book) => book.status === 'active');
  const completedBooks = books.filter((book) => book.status === 'completed');
  const archivedBooks = books.filter((book) => book.status === 'archived');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_55%,#F8F5FF_100%)] pb-24">
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#22324A]">My Library</h1>
            <p className="mt-1 text-sm text-[#6A7687]">Keep your reading shelf tidy and moving.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgba(36,52,71,0.08)] bg-white/90 px-4 text-sm font-medium text-[#22324A] shadow-[0_10px_20px_rgba(31,41,55,0.06)] transition-all duration-200 hover:bg-white"
          >
            <Plus size={16} />
            <span>Add Book</span>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/88 px-3 py-1.5 text-sm text-[#6A7687] shadow-[0_8px_18px_rgba(31,41,55,0.04)]">
            {books.length} total books
          </span>
          <span className="rounded-full bg-[#EAF7F1] px-3 py-1.5 text-sm text-[#2F7D5F]">
            {activeBooks.length} currently reading
          </span>
          <span className="rounded-full bg-[#FFF2D6] px-3 py-1.5 text-sm text-[#B4831F]">
            {completedBooks.length} completed
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-[#6A7687]">Loading books...</div>
        ) : errorMessage ? (
          <div className="py-20 text-center">
            <p className="text-lg text-[#FF6B6B]">{errorMessage}</p>
            <p className="mt-2 text-sm text-[#6A7687]">Check backend connection and try again.</p>
          </div>
        ) : books.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#DFF5EA]">
              <BookOpen size={36} className="text-[#3D9B7A]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#22324A]">No books yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#6A7687]">
              Add your first book to start building your reading habit.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#A8E6CF] px-5 text-sm font-medium text-[#22324A] shadow-[0_10px_22px_rgba(76,167,132,0.18)] transition-all duration-200 hover:bg-[#9CDEC5]"
            >
              <Plus size={16} />
              <span>Add your first book</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <LibrarySection title="Currently Reading" books={activeBooks} onOpenBook={(bookId) => navigate(`/book/${bookId}`)} />
            <LibrarySection title="Completed" books={completedBooks} onOpenBook={(bookId) => navigate(`/book/${bookId}`)} />
            <LibrarySection title="Archived" books={archivedBooks} onOpenBook={(bookId) => navigate(`/book/${bookId}`)} />
          </div>
        )}
      </div>

      <BottomNav />
      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddBook} />
    </div>
  );
}
