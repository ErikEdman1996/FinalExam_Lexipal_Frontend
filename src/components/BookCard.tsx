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
      className="bg-white rounded-[24px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer border border-[rgba(0,0,0,0.05)]"
    >
      <div className="min-w-0">
        <h3 className="text-[#2C3E50] font-semibold truncate mb-1">{book.title}</h3>
        <p className="text-sm text-[#6C757D] mb-3 truncate">{book.author}</p>

        <ProgressBar current={book.pagesRead} total={book.totalPages} color="mint" height="md" />

        <div className="flex justify-between items-center mt-3 text-sm">
          <span className="text-[#6C757D]">
            {book.pagesRead} / {book.totalPages} pages
          </span>
          <span className="text-[#A8E6CF] font-medium">
            {book.sessions} {book.sessions === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>
    </div>
  );
}
