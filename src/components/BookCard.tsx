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
}

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-[26px] border border-[rgba(36,52,71,0.08)] bg-white/92 p-5 shadow-[0_14px_28px_rgba(31,41,55,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_32px_rgba(31,41,55,0.08)]"
    >
      <div className="min-w-0">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-[#22324A]">{book.title}</h3>
            <p className="mt-1 truncate text-sm text-[#6A7687]">{book.author}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#DFF5EA]">
            <span className="text-sm font-semibold text-[#3D9B7A]">{Math.round((book.pagesRead / book.totalPages) * 100)}%</span>
          </div>
        </div>

        <ProgressBar current={book.pagesRead} total={book.totalPages} color="mint" height="md" />

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-[#6A7687]">
            {book.pagesRead} / {book.totalPages} pages
          </span>
          <span className="rounded-full bg-[#F4F8FC] px-3 py-1 font-medium text-[#4B647C]">
            {book.sessions} {book.sessions === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>
    </div>
  );
}
