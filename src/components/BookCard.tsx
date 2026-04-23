import { useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar } from './ProgressBar.tsx';

export interface BookData {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
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
    <div className="min-w-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-text">{book.title}</h3>
          <p className="mt-1 truncate text-sm text-text-muted">{book.author}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft">
          <span className="text-sm font-semibold text-brand-strong">{completionPercent}%</span>
        </div>
      </div>

      <ProgressBar current={book.pagesRead} total={book.totalPages} color="brand" height="md" />

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-text-muted">
          {book.pagesRead} / {book.totalPages} pages
        </span>
        <span className="rounded-full bg-surface-muted px-3 py-1 font-medium text-text">
          {book.sessions} {book.sessions === 1 ? 'session' : 'sessions'}
        </span>
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
