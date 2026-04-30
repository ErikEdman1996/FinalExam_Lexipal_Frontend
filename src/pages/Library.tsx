import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Library as LibraryIcon,
  Plus,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createBook, type CreateBookRequest, type LibraryItemResponseDTO } from '../api/api';
import { AddBookModal } from '../components/AddBookModal.tsx';
import { BookCover } from '../components/BookCover.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { inputClassName } from '../components/form/inputStyles';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { useBookTransition } from '../features/bookTransition/useBookTransition.ts';
import { useBooks } from '../features/books/useBooks.ts';

type ShelfTab = 'active' | 'completed' | 'archived' | 'all';
type BookStatus = 'active' | 'completed' | 'archived';
type StatTone = 'brand' | 'accent';
type SortKey =
  | 'author-last-asc'
  | 'author-last-desc'
  | 'title-asc'
  | 'title-desc'
  | 'units-read-desc'
  | 'units-read-asc'
  | 'progress-desc'
  | 'progress-asc'
  | 'created-desc'
  | 'created-asc';

interface LibraryBookItem {
  kind: 'book';
  id: string;
  itemId: number;
  title: string;
  author: string;
  coverImageUrl: string | null;
  pagesRead: number;
  totalPages: number;
  progressPercentage: number;
  sessions: number;
  status: BookStatus;
  addedAt: string;
}

const BOOK_SHELF_TABS: Array<{ key: ShelfTab; label: string }> = [
  { key: 'active', label: 'Reading' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
];

const BOOK_SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'created-desc', label: 'Newest added' },
  { value: 'created-asc', label: 'Oldest added' },
  { value: 'author-last-asc', label: 'Author last name (A-Z)' },
  { value: 'author-last-desc', label: 'Author last name (Z-A)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'units-read-desc', label: 'Most pages read' },
  { value: 'units-read-asc', label: 'Fewest pages read' },
  { value: 'progress-desc', label: 'Highest progress' },
  { value: 'progress-asc', label: 'Lowest progress' },
];

const DEFAULT_SORT: SortKey = 'created-desc';
const SORT_VALUES = new Set<SortKey>(BOOK_SORT_OPTIONS.map((option) => option.value));

function isSortKey(value: string | null): value is SortKey {
  return value != null && SORT_VALUES.has(value as SortKey);
}

function getCreatorName(value: string | null, fallback: string) {
  return value?.trim() || fallback;
}

function clampPercentage(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function mapApiStatusToUiStatus(status: string): BookStatus {
  if (status === 'COMPLETED') {
    return 'completed';
  }

  if (status === 'ARCHIVED') {
    return 'archived';
  }

  return 'active';
}

function mapLibraryItemToBook(item: LibraryItemResponseDTO, sessions: number): LibraryBookItem {
  const safeTotalPages = Math.max(0, item.totalUnits);
  const safePagesRead = Math.max(0, Math.min(item.completedUnits, safeTotalPages));

  return {
    kind: 'book',
    id: `book-${item.itemId}`,
    itemId: item.itemId,
    title: item.title,
    author: getCreatorName(item.creatorName, 'Unknown author'),
    coverImageUrl: item.coverImageUrl,
    pagesRead: safePagesRead,
    totalPages: safeTotalPages,
    progressPercentage: clampPercentage(item.progressPercentage),
    sessions,
    status: mapApiStatusToUiStatus(item.status),
    addedAt: item.addedAt,
  };
}

function getAuthorLastName(author: string) {
  const parts = author.trim().split(/\s+/).filter(Boolean);
  return parts.at(-1)?.toLowerCase() ?? '';
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true });
}

function getProgress(item: LibraryBookItem) {
  return item.totalPages > 0 ? item.pagesRead / item.totalPages : 0;
}

function getCreatedAtMs(item: LibraryBookItem) {
  const parsed = new Date(item.addedAt).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareTieBreakers(left: LibraryBookItem, right: LibraryBookItem) {
  const titleComparison = compareText(left.title, right.title);

  if (titleComparison !== 0) {
    return titleComparison;
  }

  return left.itemId - right.itemId;
}

function sortLibraryItems<TItem extends LibraryBookItem>(items: TItem[], sortKey: SortKey) {
  return [...items].sort((left, right) => {
    let result = 0;

    if (sortKey === 'author-last-asc' || sortKey === 'author-last-desc') {
      result = compareText(getAuthorLastName(left.author), getAuthorLastName(right.author));
      if (result === 0) {
        result = compareText(left.author, right.author);
      }
    } else if (sortKey === 'title-asc' || sortKey === 'title-desc') {
      result = compareText(left.title, right.title);
    } else if (sortKey === 'units-read-desc' || sortKey === 'units-read-asc') {
      result = left.pagesRead - right.pagesRead;
    } else if (sortKey === 'progress-desc' || sortKey === 'progress-asc') {
      result = getProgress(left) - getProgress(right);
    } else {
      result = getCreatedAtMs(left) - getCreatedAtMs(right);
    }

    if (sortKey.endsWith('-desc')) {
      result *= -1;
    }

    return result || compareTieBreakers(left, right);
  });
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

interface ShelfTabsProps {
  active: ShelfTab;
  onChange: (next: ShelfTab) => void;
  counts: Record<ShelfTab, number>;
  tabs: Array<{ key: ShelfTab; label: string }>;
}

function ShelfTabs({ active, onChange, counts, tabs }: ShelfTabsProps) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 shadow-[0_8px_18px_rgba(31,41,55,0.04)] sm:w-fit">
      {tabs.map((tab) => {
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
  itemLabel: string;
  activeShelfTab: ShelfTab;
  onClear: () => void;
}

function LibraryEmptyFiltered({ query, itemLabel, activeShelfTab, onClear }: FilteredEmptyProps) {
  const message = query.trim().length > 0
    ? `No ${itemLabel} match "${query.trim()}"`
    : 'Nothing in this shelf yet.';

  return (
    <div className="flex flex-col items-center rounded-[28px] border border-border bg-surface px-6 py-12 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
        <Search size={22} className="text-text-subtle" />
      </div>
      <h3 className="text-lg font-semibold text-text">{message}</h3>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-text-muted">
        Try a different search or switch to another shelf.
      </p>
      {(query.trim().length > 0 || activeShelfTab !== 'all') && (
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

const cardClassName = 'rounded-[26px] border border-border bg-surface p-5 shadow-[0_14px_28px_rgba(31,41,55,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-[0_18px_32px_rgba(31,41,55,0.08)]';

const isPlainLeftClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
  return (
    event.button === 0
    && event.detail !== 0
    && !event.defaultPrevented
    && !event.metaKey
    && !event.altKey
    && !event.ctrlKey
    && !event.shiftKey
  );
};

function LibraryBookCard({
  book,
  isTransitionBlocked,
  onSelect,
}: {
  book: LibraryBookItem;
  isTransitionBlocked: boolean;
  onSelect: (book: LibraryBookItem, rect: DOMRect) => void;
}) {
  const rootRef = useRef<HTMLAnchorElement | null>(null);
  const progressLabel = `${book.pagesRead} / ${book.totalPages} pages`;

  return (
    <Link
      ref={rootRef}
      to={`/book/${book.itemId}`}
      onClick={(event) => {
        if (!rootRef.current || isTransitionBlocked || !isPlainLeftClick(event)) {
          return;
        }

        event.preventDefault();
        onSelect(book, rootRef.current.getBoundingClientRect());
      }}
      className={`${cardClassName} block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
    >
      <div className="flex min-w-0 gap-4">
        <BookCover
          title={book.title}
          author={book.author}
          coverImageUrl={book.coverImageUrl}
          size="sm"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-text">{book.title}</h3>
              <p className="mt-1 truncate text-sm text-text-muted">{book.author}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brand-soft">
              <span className="text-xs font-semibold text-brand-strong">{Math.round(book.progressPercentage)}%</span>
            </div>
          </div>

          <div className="mt-3">
            <ProgressBar current={book.pagesRead} total={book.totalPages} color="brand" height="md" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted">{progressLabel}</span>
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-medium text-text">
              Book
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { start: startBookTransition, activeBook } = useBookTransition();
  const {
    books: apiBooks,
    libraryItems,
    libraryItemsErrorMessage,
    isLibraryItemsLoading,
    refreshBooks,
    refreshLibraryItems,
    upsertBook,
  } = useBooks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShelfTab, setActiveShelfTab] = useState<ShelfTab>('active');
  const hadCachedLibraryItemsOnMountRef = useRef(libraryItems.length > 0);
  const sortParam = searchParams.get('sort');
  const sortKey: SortKey = isSortKey(sortParam)
    && BOOK_SORT_OPTIONS.some((option) => option.value === sortParam)
    ? sortParam
    : DEFAULT_SORT;

  const sessionCountByBookId = useMemo(() => {
    return new Map(apiBooks.map((book) => {
      const sessionCount = typeof book.sessionCount === 'number'
        ? Math.max(0, book.sessionCount)
        : book.sessions.filter((session) => session.status === 'COMPLETED').length;

      return [book.id, sessionCount] as const;
    }));
  }, [apiBooks]);

  const bookItems = useMemo(() => {
    return libraryItems
      .filter((item) => item.itemType === 'BOOK')
      .map((item) => mapLibraryItemToBook(item, sessionCountByBookId.get(item.itemId) ?? 0));
  }, [libraryItems, sessionCountByBookId]);

  useEffect(() => {
    if (!hadCachedLibraryItemsOnMountRef.current) {
      return;
    }

    void refreshLibraryItems({ silent: true }).catch((error) => {
      console.error('Error refreshing library items when opening library:', error);
    });
  }, [refreshLibraryItems]);

  const completedCount = useMemo(() => {
    return bookItems.filter((book) => book.status === 'completed').length;
  }, [bookItems]);

  const shelfCounts = useMemo<Record<ShelfTab, number>>(() => {
    return {
      all: bookItems.length,
      active: bookItems.filter((book) => book.status === 'active').length,
      completed: completedCount,
      archived: bookItems.filter((book) => book.status === 'archived').length,
    };
  }, [bookItems, completedCount]);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filteredItems = bookItems.filter((item) => {
      if (activeShelfTab !== 'all') {
        if (item.status !== activeShelfTab) {
          return false;
        }
      }

      if (query.length === 0) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(query)
        || item.author.toLowerCase().includes(query)
      );
    });

    return sortLibraryItems(filteredItems, sortKey);
  }, [activeShelfTab, bookItems, searchQuery, sortKey]);

  const handleAddBook = async (newBook: CreateBookRequest) => {
    const createdBook = await createBook(newBook);
    upsertBook(createdBook);
    void refreshBooks({ silent: true }).catch((error) => {
      console.error('Error refreshing books after create:', error);
    });
    void refreshLibraryItems({ silent: true }).catch((error) => {
      console.error('Error refreshing library items after create:', error);
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveShelfTab('all');
  };

  const handleSortChange = (nextSort: SortKey) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sort', nextSort);
    setSearchParams(nextParams);
  };

  const handleBookSelect = (book: LibraryBookItem, rect: DOMRect) => {
    if (activeBook) return;
    startBookTransition({
      id: String(book.itemId),
      title: book.title,
      author: book.author,
      coverImageUrl: book.coverImageUrl,
      pagesRead: book.pagesRead,
      totalPages: book.totalPages,
      sessions: book.sessions,
    }, rect);
    window.setTimeout(() => {
      void navigate(`/book/${book.itemId}`);
    }, 600);
  };

  const searchLabel = 'Search books by title or author';

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
                Keep books tidy, current, and moving.
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
            <StatTile label="Total Books" value={bookItems.length} tone="brand" icon={LibraryIcon} />
            <StatTile label="Reading" value={shelfCounts.active} tone="brand" icon={BookOpen} />
            <StatTile label="Completed" value={completedCount} tone="accent" icon={BookOpenCheck} />
            <StatTile label="Archived" value={shelfCounts.archived} tone="accent" icon={BookMarked} />
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(16rem,1fr)_minmax(12rem,16rem)] xl:max-w-2xl">
            <div>
              <label htmlFor="library-search" className="sr-only">
                {searchLabel}
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
                />
                <input
                  id="library-search"
                  name="search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search books"
                  className={`${inputClassName} h-11 rounded-full bg-surface pl-10 shadow-[0_8px_18px_rgba(31,41,55,0.04)]`}
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <label htmlFor="library-sort" className="sr-only">
                Sort books
              </label>
              <select
                id="library-sort"
                value={sortKey}
                onChange={(event) => handleSortChange(event.target.value as SortKey)}
                className={`${inputClassName} h-11 rounded-full bg-surface shadow-[0_8px_18px_rgba(31,41,55,0.04)]`}
              >
                {BOOK_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ShelfTabs active={activeShelfTab} onChange={setActiveShelfTab} counts={shelfCounts} tabs={BOOK_SHELF_TABS} />
        </div>

        <div className="mt-6">
          {isLibraryItemsLoading ? (
            <div className="flex flex-col items-center rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
                <BookMarked size={22} className="text-brand-strong" />
              </div>
              <p className="text-sm text-text-muted">Loading your library...</p>
            </div>
          ) : libraryItemsErrorMessage ? (
            <div className="flex flex-col items-center rounded-[28px] border border-danger/30 bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
                <ShieldAlert size={22} className="text-danger" />
              </div>
              <p className="text-lg font-semibold text-danger">{libraryItemsErrorMessage}</p>
              <p className="mt-2 max-w-xs text-sm text-text-muted">
                Check backend connection and try again.
              </p>
              <button
                type="button"
                onClick={() => {
                  void refreshLibraryItems().catch((error) => {
                    console.error('Error retrying library item load:', error);
                  });
                }}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-alt"
              >
                Try again
              </button>
            </div>
          ) : bookItems.length === 0 ? (
            <div className="flex flex-col items-center rounded-[32px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
                <BookOpen size={36} className="text-brand-strong" />
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text">
                No books yet
              </h2>
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
          ) : visibleItems.length === 0 ? (
            <LibraryEmptyFiltered
              query={searchQuery}
              itemLabel="books"
              activeShelfTab={activeShelfTab}
              onClear={handleClearFilters}
            />
          ) : (
            <div
              className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                activeBook ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              {visibleItems.map((item) => (
                <LibraryBookCard
                  key={item.id}
                  book={item}
                  isTransitionBlocked={activeBook != null}
                  onSelect={handleBookSelect}
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
