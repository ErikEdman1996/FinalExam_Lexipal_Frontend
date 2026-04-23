import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { CreateBookRequest } from '../api/api';
import { Button } from './Button.tsx';
import { AppDialog, AppDialogClose, AppDialogTitle } from './dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldLabelClassName,
  inputClassName,
} from './form/inputStyles';

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

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      canClose={!isSubmitting}
      contentClassName="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <AppDialogTitle className="text-xl font-semibold text-text">
          Add new book
        </AppDialogTitle>
        <AppDialogClose asChild>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close add book modal"
            disabled={isSubmitting}
          >
            <X size={20} className="text-text-muted" />
          </button>
        </AppDialogClose>
      </div>

      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
        className="mt-6 space-y-4"
      >
        <div>
          <label htmlFor="add-book-title" className={fieldLabelClassName}>
            Book Title
          </label>
          <input
            id="add-book-title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClassName}
            placeholder="Enter book title"
            autoComplete="off"
            inputMode="text"
            spellCheck={false}
            required
          />
        </div>

        <div>
          <label htmlFor="add-book-author" className={fieldLabelClassName}>
            Author
          </label>
          <input
            id="add-book-author"
            name="author"
            type="text"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className={inputClassName}
            placeholder="Enter author name"
            autoComplete="off"
            inputMode="text"
            spellCheck={false}
            required
          />
        </div>

        <div>
          <label htmlFor="add-book-total-pages" className={fieldLabelClassName}>
            Total Pages
          </label>
          <input
            id="add-book-total-pages"
            name="totalPages"
            type="number"
            value={totalPages}
            onChange={(event) => setTotalPages(event.target.value)}
            className={inputClassName}
            placeholder="Enter total pages"
            min="1"
            inputMode="numeric"
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
          <p className={fieldErrorClassName}>{submitError}</p>
        ) : null}
      </form>
    </AppDialog>
  );
}
