import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  Archive,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Library as LibraryIcon,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createBook, type ApiBook, type CreateBookRequest } from '../api/api';
import { AddBookModal } from '../components/AddBookModal.tsx';
import { BookCard, type BookData } from '../components/BookCard.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { useBookTransition } from '../features/bookTransition/BookTransitionContext.tsx';
import { useBooks } from '../features/books/BooksProvider.tsx';

type BookStatus = 'active' | 'completed' | 'archived';
type TabKey = 'all' | 'active' | 'completed' | 'archived';
type StatTone = 'brand' | 'accent';

interface LibraryBook extends BookData {
  status: BookStatus;
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
  const derivedCompletedSessionCount = Array.isArray(book.sessions)
    ? book.sessions.filter((session) => session.status === 'COMPLETED').length
    : 0;
  const sessionCount = typeof book.sessionCount === 'number'
    ? Math.max(0, book.sessionCount)
    : derivedCompletedSessionCount;

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

const TONE_STYLES: Record<StatTone, { chip: string; icon: string }> = {
  brand: {
    chip: 'bg-brand-soft',
    icon: 'text-brand-strong',
  },
  accent: {
    chip: 'bg-accent-soft',
    icon: 'text-accent-strong',
  },
};

interface StatTileProps {
  label: string;
  value: number;
  tone: StatTone;
  icon: ComponentType<{ size?: number; className?: string }>;
}

function StatTile({ label, value, tone, icon: Icon }: StatTileProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-border bg-surface p-4 shadow-[0_10px_22px_rgba(31,41,55,0.05)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${styles.chip}`}>
        <Icon size={18} className={styles.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-text-subtle">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-text">{value}</p>
      </div>
    </div>
  );
}

interface LibraryTabsProps {
  active: TabKey;
  onChange: (next: TabKey) => void;
  counts: Record<TabKey, number>;
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Reading' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

function LibraryTabs({ active, onChange, counts }: LibraryTabsProps) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 shadow-[0_8px_18px_rgba(31,41,55,0.04)] sm:w-fit">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-brand text-text-on-brand shadow-[0_6px_14px_rgba(154,74,66,0.24)]'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-xs ${isActive ? 'text-text-on-brand/80' : 'text-text-subtle'}`}>
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface FilteredEmptyProps {
  query: string;
  activeTab: TabKey;
  onClear: () => void;
}

function LibraryEmptyFiltered({ query, activeTab, onClear }: FilteredEmptyProps) {
  const message = query.trim().length > 0
    ? `No books match "${query.trim()}"`
    : 'Nothing in this shelf yet.';

  return (
    <div className="flex flex-col items-center rounded-[28px] border border-border bg-surface px-6 py-12 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
        <Search size={22} className="text-text-subtle" />
      </div>
      <h3 className="text-lg font-semibold text-text">{message}</h3>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-text-muted">
        Try a different search or switch to another tab.
      </p>
      {(query.trim().length > 0 || activeTab !== 'all') && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-alt"
        >
          <X size={14} />
          <span>Clear filters</span>
        </button>
      )}
    </div>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const { start: startBookTransition, activeBook } = useBookTransition();
  const {
    books: apiBooks,
    errorMessage,
    isLoading,
    refreshBooks,
    upsertBook,
  } = useBooks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const hadCachedBooksOnMountRef = useRef(apiBooks.length > 0);

  const books = useMemo(() => {
    return apiBooks.map(mapBackendBookToLibraryBook);
  }, [apiBooks]);

  useEffect(() => {
    if (!hadCachedBooksOnMountRef.current) {
      return;
    }

    void refreshBooks({ silent: true }).catch((error) => {
      console.error('Error refreshing books when opening library:', error);
    });
  }, [refreshBooks]);

  const handleAddBook = async (newBook: CreateBookRequest) => {
    const createdBook = await createBook(newBook);
    upsertBook(createdBook);
    void refreshBooks({ silent: true }).catch((error) => {
      console.error('Error refreshing books after create:', error);
    });
  };

  const counts = useMemo<Record<TabKey, number>>(
    () => ({
      all: books.length,
      active: books.filter((book) => book.status === 'active').length,
      completed: books.filter((book) => book.status === 'completed').length,
      archived: books.filter((book) => book.status === 'archived').length,
    }),
    [books],
  );

  const visibleBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      if (activeTab !== 'all' && book.status !== activeTab) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    });
  }, [books, searchQuery, activeTab]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
  };

  return (
    <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
      <div className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[32px] border border-border bg-surface p-5 shadow-[0_20px_48px_rgba(15,23,42,0.07)] sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">
                Your shelf
              </p>
              <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-text sm:text-[2.4rem]">
                My Library
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
                Keep your reading shelf tidy and moving.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-text-on-brand shadow-[0_12px_24px_rgba(154,74,66,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-hover lg:h-12 lg:px-6 lg:text-base"
            >
              <Plus size={18} />
              <span>Add Book</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total" value={counts.all} tone="brand" icon={LibraryIcon} />
            <StatTile label="Reading" value={counts.active} tone="brand" icon={BookOpen} />
            <StatTile label="Completed" value={counts.completed} tone="accent" icon={BookOpenCheck} />
            <StatTile label="Archived" value={counts.archived} tone="accent" icon={Archive} />
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title or author"
              className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-text placeholder:text-text-subtle shadow-[0_8px_18px_rgba(31,41,55,0.04)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <LibraryTabs active={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
                <BookMarked size={22} className="text-brand-strong" />
              </div>
              <p className="text-sm text-text-muted">Loading your books...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center rounded-[28px] border border-danger/30 bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
                <BookOpen size={22} className="text-danger" />
              </div>
              <p className="text-lg font-semibold text-danger">{errorMessage}</p>
              <p className="mt-2 max-w-xs text-sm text-text-muted">
                Check backend connection and try again.
              </p>
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center rounded-[32px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
                <BookOpen size={36} className="text-brand-strong" />
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text">No books yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
                Add your first book to start building your reading habit.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-text-on-brand shadow-[0_12px_24px_rgba(154,74,66,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-hover"
              >
                <Plus size={16} />
                <span>Add your first book</span>
              </button>
            </div>
          ) : visibleBooks.length === 0 ? (
            <LibraryEmptyFiltered
              query={searchQuery}
              activeTab={activeTab}
              onClear={handleClearFilters}
            />
          ) : (
            <div
              className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                activeBook ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              {visibleBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSelect={(rect) => {
                    if (activeBook) return;
                    startBookTransition(book, rect);
                    window.setTimeout(() => navigate(`/book/${book.id}`), 600);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddBook} />
    </div>
  );
}
