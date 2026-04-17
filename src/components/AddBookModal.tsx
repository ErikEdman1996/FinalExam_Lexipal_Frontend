import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.tsx';
import type { CreateBookRequest } from '../api/api';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: CreateBookRequest) => Promise<void> | void;
}

export function AddBookModal({ isOpen, onClose, onAdd }: AddBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const parsedTotalPages = Number(totalPages);

    if (!trimmedTitle || !trimmedAuthor || !Number.isInteger(parsedTotalPages) || parsedTotalPages < 1) {
      setSubmitError('Enter a title, author, and a total page count of at least 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onAdd({
        title: trimmedTitle,
        author: trimmedAuthor,
        totalPages: parsedTotalPages,
      });
      setTitle('');
      setAuthor('');
      setTotalPages('');
      onClose();
    } catch (error) {
      console.error('Error adding book:', error);
      setSubmitError('Could not add book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = 'w-full rounded-[16px] border border-border bg-surface-muted px-4 py-3 text-text outline-none transition-all focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in duration-200">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">Add New Book</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-muted"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm text-text">
              Book Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClassName}
              placeholder="Enter book title"
              required
            />
          </div>

          <div>
            <label htmlFor="author" className="mb-2 block text-sm text-text">
              Author
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              className={inputClassName}
              placeholder="Enter author name"
              required
            />
          </div>

          <div>
            <label htmlFor="pages" className="mb-2 block text-sm text-text">
              Total Pages
            </label>
            <input
              id="pages"
              type="number"
              value={totalPages}
              onChange={(event) => setTotalPages(event.target.value)}
              className={inputClassName}
              placeholder="Enter total pages"
              min="1"
              required
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Book'}
            </Button>
          </div>

          {submitError ? (
            <p className="mt-2 text-sm text-danger">{submitError}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
