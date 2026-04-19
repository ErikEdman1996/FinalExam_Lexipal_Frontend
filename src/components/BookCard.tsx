import { useRef } from 'react';
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
  onClick?: () => void;
  onSelect?: (rect: DOMRect) => void;
}

export function BookCard({ book, onClick, onSelect }: BookCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (onSelect && rootRef.current) {
      onSelect(rootRef.current.getBoundingClientRect());
      return;
    }
    onClick?.();
  };

  return (
    <div
      ref={rootRef}
      onClick={handleClick}
      className="cursor-pointer rounded-[26px] border border-border bg-surface p-5 shadow-[0_14px_28px_rgba(31,41,55,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-[0_18px_32px_rgba(31,41,55,0.08)]"
    >
      <div className="min-w-0">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-text">{book.title}</h3>
            <p className="mt-1 truncate text-sm text-text-muted">{book.author}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft">
            <span className="text-sm font-semibold text-brand-strong">{Math.round((book.pagesRead / book.totalPages) * 100)}%</span>
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
    </div>
  );
}
