import { useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover.tsx';
import { ProgressBar } from './ProgressBar.tsx';

export interface BookData {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
  pagesRead: number;
  totalPages: number;
  sessions: number;
}

interface BookCardProps {
  book: BookData;
  to?: string;
  onClick?: () => void;
  onSelect?: (rect: DOMRect) => void;
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

export function BookCard({ book, to, onClick, onSelect }: BookCardProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const completionPercent = book.totalPages > 0
    ? Math.round((book.pagesRead / book.totalPages) * 100)
    : 0;

  const content = (
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
            <span className="text-xs font-semibold text-brand-strong">{completionPercent}%</span>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar current={book.pagesRead} total={book.totalPages} color="brand" height="md" />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="text-text-muted">
            {book.pagesRead} / {book.totalPages} pages
          </span>
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-medium text-text">
            {book.sessions} {book.sessions === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        ref={(node) => {
          rootRef.current = node;
        }}
        to={to}
        onClick={(event) => {
          if (onSelect && rootRef.current && isPlainLeftClick(event)) {
            event.preventDefault();
            onSelect(rootRef.current.getBoundingClientRect());
            return;
          }

          onClick?.();
        }}
        className={`${cardClassName} block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
      >
        {content}
      </Link>
    );
  }

  if (onClick || onSelect) {
    return (
      <button
        ref={(node) => {
          rootRef.current = node;
        }}
        type="button"
        onClick={() => {
          if (onSelect && rootRef.current) {
            onSelect(rootRef.current.getBoundingClientRect());
            return;
          }

          onClick?.();
        }}
        className={`${cardClassName} w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
      }}
      className={cardClassName}
    >
      {content}
    </div>
  );
}
